import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/google-books", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-books")>();
  return {
    ...actual,
    searchBooks: vi.fn(),
    BooksApiError: class BooksApiError extends Error {
      status: number;
      constructor(msg: string, status: number) {
        super(msg);
        this.status = status;
      }
    },
  };
});

import { auth } from "@/auth";
import { searchBooks, BooksApiError } from "@/lib/google-books";
import { GET } from "@/app/api/books/search/route";

const authMock = vi.mocked(auth);
const searchMock = vi.mocked(searchBooks);
beforeEach(() => {
  authMock.mockReset();
  searchMock.mockReset();
});

const req = (url: string) => new Request(url);

describe("GET /api/books/search", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await GET(req("http://localhost/api/books/search?q=x"));
    expect(res.status).toBe(401);
  });

  it("ล็อกอินแล้ว → 200 พร้อม books", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } } as never);
    searchMock.mockResolvedValueOnce([{ title: "แฮร์รี่" }] as never);
    const res = await GET(req("http://localhost/api/books/search?q=แฮร์รี่&type=text"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books).toHaveLength(1);
    expect(searchMock).toHaveBeenCalledWith({ q: "แฮร์รี่", type: "text" });
  });

  it("q ว่าง → 400", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const res = await GET(req("http://localhost/api/books/search?q="));
    expect(res.status).toBe(400);
  });

  it("type ไม่รู้จัก → 400", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const res = await GET(req("http://localhost/api/books/search?q=x&type=bogus"));
    expect(res.status).toBe(400);
  });

  it("Google Books ล่ม → 502", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } } as never);
    searchMock.mockRejectedValueOnce(new BooksApiError("quota", 429));
    const res = await GET(req("http://localhost/api/books/search?q=x"));
    expect(res.status).toBe(502);
  });
});
