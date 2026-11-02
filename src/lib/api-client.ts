import type { BookStatus } from "@/generated/prisma/client";
import type { NormalizedBook } from "@/lib/book-types";

export type ShelfBook = {
  id: string;
  googleBooksId: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  categories: string[];
  isbn10: string | null;
  isbn13: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
  createdByUserId: string | null;
};

export type ShelfItem = {
  id: string;
  status: BookStatus;
  tags: string[];
  book: ShelfBook;
};

async function request<T>(input: string, init: RequestInit, fallbackError: string): Promise<T> {
  const res = await fetch(input, init);
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    // ข้อความจาก server (ไทย) แสดงตรง ๆ; ถ้าไม่มี แนบ fallbackKey ให้ UI แปลงตาม locale
    const error = new Error(body?.error ?? fallbackError) as Error & { fallbackKey?: string };
    error.name = "ApiError";
    if (!body?.error) error.fallbackKey = fallbackError;
    throw error;
  }
  return body as T;
}

export function apiGet<T>(url: string, fallbackError = "errors.generic"): Promise<T> {
  return request<T>(url, { method: "GET" }, fallbackError);
}

export function apiPost<T>(url: string, data: unknown, fallbackError = "errors.generic"): Promise<T> {
  return request<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, fallbackError);
}

export function apiPatch<T>(url: string, data: unknown, fallbackError = "errors.generic"): Promise<T> {
  return request<T>(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, fallbackError);
}

export async function apiDelete(url: string, fallbackError = "errors.generic"): Promise<void> {
  await request<void>(url, { method: "DELETE" }, fallbackError);
}

export async function searchBooksClient(q: string, type: string): Promise<NormalizedBook[]> {
  const data = await apiGet<{ books: NormalizedBook[] }>(
    `/api/books/search?q=${encodeURIComponent(q)}&type=${type}`,
    "errors.searchFailed",
  );
  return data.books;
}

export async function fetchShelf(params?: { status?: string; q?: string; tag?: string }): Promise<ShelfItem[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.q) search.set("q", params.q);
  if (params?.tag) search.set("tag", params.tag);
  const qs = search.toString();
  const data = await apiGet<{ items: ShelfItem[] }>(`/api/shelf${qs ? `?${qs}` : ""}`);
  return data.items;
}

export async function addToShelf(book: NormalizedBook, status: BookStatus, tags: string[] = []): Promise<void> {
  await apiPost("/api/shelf", { book, status, tags }, "errors.generic");
}

export async function updateShelfItem(itemId: string, data: { status?: BookStatus; tags?: string[] }): Promise<void> {
  await apiPatch(`/api/shelf/${itemId}`, data, "errors.generic");
}

export async function deleteShelfItem(itemId: string): Promise<void> {
  await apiDelete(`/api/shelf/${itemId}`, "errors.notFound");
}
