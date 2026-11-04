import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/google-books", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-books")>();
  return {
    ...actual,
    fetchEditions: vi.fn(),
  };
});

import { auth } from "@/auth";
import { fetchEditions } from "@/lib/google-books";
import { GET } from "@/app/api/books/editions/route";

const authMock = vi.mocked(auth);
const editionsMock = vi.mocked(fetchEditions);
beforeEach(() => {
  authMock.mockReset();
  editionsMock.mockReset();
});

const session = { user: { id: "u1" } } as never;

describe("GET /api/books/editions", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await GET(new Request("http://localhost/x?title=x"));
    expect(res.status).toBe(401);
  });

  it("title ว่าง → 400", async () => {
    authMock.mockResolvedValueOnce(session);
    const res = await GET(new Request("http://localhost/x?title="));
    expect(res.status).toBe(400);
  });

  it("ล็อกอินแล้ว → 200 พร้อม editions", async () => {
    authMock.mockResolvedValueOnce(session);
    editionsMock.mockResolvedValueOnce([{ title: "X" }] as never);
    const res = await GET(new Request("http://localhost/x?title=" + encodeURIComponent("The seven year slip")));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.editions).toHaveLength(1);
    expect(editionsMock).toHaveBeenCalledWith("The seven year slip");
  });
});
