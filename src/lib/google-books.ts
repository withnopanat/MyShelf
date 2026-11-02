/**
 * service สำหรับ Google Books API + OpenLibrary covers
 * ทุกฟังก์ชันเรียกจากฝั่ง server เท่านั้น (ซ่อน API key)
 */

import type { NormalizedBook } from "@/lib/book-types";
import { scrapeThaiCover } from "@/lib/thai-covers";

export type { NormalizedBook };

export class BooksApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BooksApiError";
    this.status = status;
  }
}

// ── ISBN helpers ────────────────────────────────────────────────────

/** ตัดขีด/ช่องว่าง แล้วตรวจ checksum (ISBN-13 และ ISBN-10 รองรับ X) */
export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[-\s]/g, "");
  if (!/^\d{9}[\dX]$|^\d{13}$/.test(cleaned)) return null;

  if (cleaned.length === 13) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0 ? cleaned : null;
  }

  // ISBN-10
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = cleaned[i] === "X" ? 10 : Number(cleaned[i]);
    sum += digit * (10 - i);
  }
  return sum % 11 === 0 ? cleaned : null;
}

/** แปลง ISBN-10 → ISBN-13 (คำนวณ checksum ใหม่) */
export function isbn10To13(isbn10: string): string | null {
  const cleaned = normalizeIsbn(isbn10);
  if (!cleaned || cleaned.length !== 10) return null;
  const body = `978${cleaned.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

// ── normalizer ──────────────────────────────────────────────────────

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
}

export function normalizeVolume(v: unknown): NormalizedBook | null {
  if (typeof v !== "object" || v === null) return null;
  const volume = v as Record<string, unknown>;
  const id = asString(volume.id);
  const info = volume.volumeInfo;
  if (!id || typeof info !== "object" || info === null) return null;
  const volumeInfo = info as Record<string, unknown>;
  const title = asString(volumeInfo.title);
  if (!title) return null;

  const identifiers = Array.isArray(volumeInfo.industryIdentifiers)
    ? (volumeInfo.industryIdentifiers as Array<Record<string, unknown>>)
    : [];
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10")?.identifier;
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13")?.identifier;
  const imageLinks = volumeInfo.imageLinks as Record<string, unknown> | undefined;
  const cover = imageLinks ? asString(imageLinks.thumbnail) ?? asString(imageLinks.smallThumbnail) : null;
  const pageCount = typeof volumeInfo.pageCount === "number" ? volumeInfo.pageCount : null;

  return {
    googleBooksId: id,
    title,
    subtitle: asString(volumeInfo.subtitle),
    authors: asStringArray(volumeInfo.authors),
    categories: asStringArray(volumeInfo.categories),
    isbn10: asString(isbn10),
    isbn13: asString(isbn13),
    coverUrl: cover ? cover.replace(/^http:/, "https:") : null,
    publisher: asString(volumeInfo.publisher),
    publishedDate: asString(volumeInfo.publishedDate),
    description: asString(volumeInfo.description),
    pageCount,
    language: asString(volumeInfo.language),
  };
}

// ── API calls ───────────────────────────────────────────────────────

const BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

function buildQuery(q: string, type: "text" | "author" | "category" | "isbn"): string {
  switch (type) {
    case "author":
      return `inauthor:"${q}"`;
    case "category":
      return `subject:"${q}"`;
    case "isbn":
      return `isbn:${q.replace(/[-\s]/g, "")}`;
    case "text":
    default:
      return q;
  }
}

async function callGoogleBooks(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new BooksApiError("ไม่สามารถเชื่อมต่อ Google Books ได้", 0);
  }
  if (!response.ok) {
    throw new BooksApiError(`Google Books ตอบสถานะ ${response.status}`, response.status);
  }
  return response.json();
}

export async function searchBooks(params: {
  q: string;
  type: "text" | "author" | "category" | "isbn";
  max?: number;
}): Promise<NormalizedBook[]> {
  const url = new URL(BOOKS_API);
  url.searchParams.set("q", buildQuery(params.q, params.type));
  url.searchParams.set("maxResults", String(params.max ?? 20));
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set("key", key);

  const data = (await callGoogleBooks(url.toString())) as { items?: unknown[] };
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map(normalizeVolume)
    .filter((b): b is NormalizedBook => b !== null);
}

export async function lookupIsbn(rawIsbn: string): Promise<NormalizedBook | null> {
  const normalized = normalizeIsbn(rawIsbn);
  if (!normalized) return null;
  const results = await searchBooks({ q: normalized, type: "isbn", max: 1 });
  let book = results[0] ?? null;
  if (!book) return null;
  if (!book.coverUrl) {
    // เรื่องเดียวกันฉบับอื่นก่อน แล้วค่อยลอง OpenLibrary
    book = await enrichFromOtherEditions(book);
    if (!book.coverUrl) {
      const fallback = await enrichCover(normalized);
      if (fallback) book = { ...book, coverUrl: fallback };
    }
  }
  return book;
}

/** ขอปกสำรองจาก OpenLibrary (404 → null) */
export async function enrichCover(isbn: string): Promise<string | null> {
  const cleaned = isbn.replace(/[-\s]/g, "");
  try {
    const response = await fetch(
      `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(cleaned)}-M.jpg?default=false`,
      { method: "HEAD", redirect: "follow" },
    );
    return response.ok ? response.url : null;
  } catch {
    return null;
  }
}

/**
 * เติม field ที่ขาด (ปก/คำอธิบาย/จำนวนหน้า) จาก "ฉบับพิมพ์อื่น" ของเรื่องเดียวกัน
 * — ฉบับแปลไทยบน Google Books มักไม่มีปก แต่ฉบับต้นฉบับมักมี
 * ถ้ามีปกและคำอธิบายครบอยู่แล้วจะไม่ยิง API (ประหยัด quota)
 */
export async function enrichFromOtherEditions(nb: NormalizedBook): Promise<NormalizedBook> {
  if (nb.coverUrl && nb.description) return nb;

  let data: { items?: unknown[] };
  try {
    const url = new URL(BOOKS_API);
    url.searchParams.set("q", `intitle:"${nb.title}"`);
    url.searchParams.set("maxResults", "10");
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    if (key) url.searchParams.set("key", key);
    data = (await callGoogleBooks(url.toString())) as { items?: unknown[] };
  } catch {
    return nb; // enrich ไม่สำเร็จ = ใช้ข้อมูลเดิม ไม่ throw
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const volumes = items
    .map(normalizeVolume)
    .filter((v): v is NormalizedBook => v !== null);
  // เลือกฉบับที่มีปกเป็นอันดับแรก (ให้ฉบับภาษาอังกฤษน้ำหนักกว่าเล็กน้อย)
  const donor =
    volumes.find((v) => v.coverUrl && v.language === "en") ?? volumes.find((v) => v.coverUrl);

  let merged: NormalizedBook = donor
    ? {
        ...nb,
        coverUrl: nb.coverUrl ?? donor.coverUrl,
        description: nb.description ?? donor.description,
        pageCount: nb.pageCount ?? donor.pageCount,
        publisher: nb.publisher ?? donor.publisher,
      }
    : nb;

  // ยังขาดปกหรือคำอธิบาย → ลองร้านไทย (ปก+คำอธิบายไทยจาก WooCommerce)
  if (!merged.coverUrl || !merged.description) {
    const thai = await scrapeThaiCover({ isbn13: nb.isbn13, title: nb.title });
    if (thai) {
      merged = {
        ...merged,
        coverUrl: merged.coverUrl || thai.coverUrl || null,
        description: merged.description ?? thai.description,
      };
    }
  }

  return merged;
}
