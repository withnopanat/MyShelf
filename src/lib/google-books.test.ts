import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeIsbn, isbn10To13, normalizeVolume, searchBooks, enrichFromOtherEditions, BooksApiError, type NormalizedBook } from "@/lib/google-books";
import fixture from "@/lib/__fixtures__/google-volume.json";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => fetchMock.mockReset());

const baseBook: NormalizedBook = {
  googleBooksId: "th-edition",
  title: "The seven year slip รักนี้เมื่อเจ็บปีที่แล้ว",
  subtitle: null,
  authors: ["Ashley Poston"],
  categories: [],
  isbn10: "6162986861",
  isbn13: "9786162986864",
  coverUrl: null,
  publisher: "นานมีบุ๊คส์",
  publishedDate: "2026",
  description: null,
  pageCount: null,
  language: "th",
};

describe("normalizeIsbn", () => {
  it("ตัดขีดและช่องว่างออกจาก ISBN-13 ที่ถูกต้อง", () => {
    expect(normalizeIsbn("978-616-337-849-1")).toBe("9786163378491");
    expect(normalizeIsbn(" 9786163378491 ")).toBe("9786163378491");
  });

  it("ISBN-10 ที่ถูกต้องผ่าน", () => {
    expect(normalizeIsbn("616-337-849-0")).toBe("6163378490");
  });

  it("ISBN-13 checksum ผิด → null", () => {
    expect(normalizeIsbn("9786163378492")).toBeNull();
  });

  it("ISBN-10 checksum ผิด → null", () => {
    expect(normalizeIsbn("6163378491")).toBeNull();
  });

  it("ตัวอักษรแปลกๆ / ความยาวผิด → null", () => {
    expect(normalizeIsbn("abc-def")).toBeNull();
    expect(normalizeIsbn("123")).toBeNull();
    expect(normalizeIsbn("")).toBeNull();
    expect(normalizeIsbn("978616337849X1")).toBeNull();
  });
});

describe("isbn10To13", () => {
  it("แปลง ISBN-10 เป็น ISBN-13 พร้อมคำนวณ checksum ใหม่", () => {
    expect(isbn10To13("6163378490")).toBe("9786163378491");
    expect(isbn10To13("616-337-849-0")).toBe("9786163378491");
  });

  it("input ไม่ใช่ ISBN-10 → null", () => {
    expect(isbn10To13("6163378491")).toBeNull();
  });
});

describe("normalizeVolume", () => {
  it("แปลง volume จาก Google Books เป็น NormalizedBook ครบทุก field", () => {
    const result = normalizeVolume(fixture);
    expect(result).toEqual({
      googleBooksId: "LSv6DwAAQBAJ",
      title: "แฮร์รี่ พอตเตอร์กับศิลาอาถรรพ์",
      subtitle: "ฉบับแปลภาษาไทย",
      authors: ["J. K. Rowling", "สุมาลี วิภาวรรณ"],
      categories: ["Fiction", "Juvenile fiction"],
      isbn10: "9749215249",
      isbn13: "9789749215241",
      coverUrl: expect.stringContaining("books.google.com"),
      publisher: "บริษัท นานมีบุ๊คส์ จำกัด",
      publishedDate: "2000",
      description: expect.stringContaining("พ่อมด"),
      pageCount: 344,
      language: "th",
    });
  });

  it("volume ไม่มี title → null", () => {
    expect(normalizeVolume({ id: "x", volumeInfo: {} })).toBeNull();
    expect(normalizeVolume("not an object")).toBeNull();
  });
});

describe("enrichFromOtherEditions", () => {
  it("มีปกและคำอธิบายครบ → ไม่ยิง API เพิ่ม", async () => {
    const complete: NormalizedBook = { ...baseBook, coverUrl: "https://x/c.jpg", description: "มีคำอธิบาย" };
    const result = await enrichFromOtherEditions(complete);
    expect(result).toEqual(complete);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ไม่มีปก → ดึงปกจากฉบับอื่นของเรื่องเดียวกัน", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            { volumeInfo: { title: "ฉบับไทย", language: "th" } }, // ไม่มีปก — ข้าม
            {
              id: "en-edition",
              volumeInfo: {
                title: "The Seven Year Slip",
                language: "en",
                imageLinks: { thumbnail: "http://books.google.com/books/content?id=en&img=1" },
                pageCount: 352,
                description: "A magical romance",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await enrichFromOtherEditions({ ...baseBook });
    expect(result.coverUrl).toBe("https://books.google.com/books/content?id=en&img=1");
    expect(result.pageCount).toBe(352);
    expect(result.description).toBe("A magical romance");
    // field เดิมที่มีอยู่แล้วต้องไม่ถูกแทนที่
    expect(result.title).toBe(baseBook.title);
    expect(result.authors).toEqual(baseBook.authors);
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("q")).toContain("intitle:");
  });

  it("ทุกฉบับไม่มีปก → คืนข้อมูลเดิม ไม่ throw", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const result = await enrichFromOtherEditions({ ...baseBook });
    expect(result.coverUrl).toBeNull();
    expect(result.title).toBe(baseBook.title);
  });
});

describe("searchBooks", () => {
  it("ค้นแบบ text ส่ง q ตรง ๆ และ normalize ผลลัพธ์", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [fixture] }), { status: 200 }),
    );
    const results = await searchBooks({ q: "แฮร์รี่ พอตเตอร์", type: "text" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("แฮร์รี่ พอตเตอร์กับศิลาอาถรรพ์");
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("q")).toBe("แฮร์รี่ พอตเตอร์");
  });

  it("ค้นแบบ author/category/isbn ใส่ prefix ให้ q", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );
    await searchBooks({ q: "Rowling", type: "author" });
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("q")).toBe('inauthor:"Rowling"');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );
    await searchBooks({ q: "9749215249", type: "isbn" });
    const url2 = new URL(fetchMock.mock.calls[1][0] as string);
    expect(url2.searchParams.get("q")).toBe("isbn:9749215249");
  });

  it("API ตอบ 429/500 → โยน BooksApiError พร้อม status", async () => {
    fetchMock.mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    await expect(searchBooks({ q: "x", type: "text" })).rejects.toMatchObject({
      name: "BooksApiError",
      status: 429,
    });
  });

  it("network ล้ม → โยน BooksApiError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(searchBooks({ q: "x", type: "text" })).rejects.toBeInstanceOf(BooksApiError);
  });

  it("ไม่มี items → คืน array ว่าง", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const results = await searchBooks({ q: "ไม่มีอะไร", type: "text" });
    expect(results).toEqual([]);
  });
});
