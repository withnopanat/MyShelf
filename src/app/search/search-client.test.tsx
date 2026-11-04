// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchClient } from "@/app/search/search-client";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
}));
const searchBooksClientMock = vi.fn().mockResolvedValue([]);
const fetchShelfMock = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    searchBooksClient: (...args: unknown[]) => searchBooksClientMock(...(args as [])),
    fetchShelf: (...args: unknown[]) => fetchShelfMock(...(args as [])),
  };
});

function renderSearch() {
  return render(
    <I18nProvider initialLocale="th">
      <SearchClient />
    </I18nProvider>,
  );
}

beforeEach(() => {
  searchBooksClientMock.mockClear();
  fetchShelfMock.mockClear();
});

describe("SearchClient search trigger", () => {
  it("พิมพ์อย่างเดียวยังไม่ค้นหา (ไม่มี auto search)", () => {
    renderSearch();
    const input = screen.getByPlaceholderText("ค้นหาชื่อหนังสือ ผู้แต่ง หมวดหมู่ หรือ ISBN") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "แฮร์รี่" } });
    expect(searchBooksClientMock).not.toHaveBeenCalled();
  });

  it("กดปุ่มค้นหา → เรียกค้นหาด้วยคำที่พิมพ์", () => {
    renderSearch();
    const input = screen.getByPlaceholderText("ค้นหาชื่อหนังสือ ผู้แต่ง หมวดหมู่ หรือ ISBN") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "แฮร์รี่" } });
    const button = screen.getByRole("button", { name: "ค้นหา" });
    fireEvent.click(button);
    expect(searchBooksClientMock).toHaveBeenCalledWith("แฮร์รี่", "text");
  });

  it("กด Enter ในช่องค้นหา → เรียกค้นหา", () => {
    renderSearch();
    const input = screen.getByPlaceholderText("ค้นหาชื่อหนังสือ ผู้แต่ง หมวดหมู่ หรือ ISBN") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "harry" } });
    fireEvent.submit(input.closest("form")!);
    expect(searchBooksClientMock).toHaveBeenCalledWith("harry", "text");
  });
});
