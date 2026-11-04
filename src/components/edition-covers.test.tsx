// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditionCovers } from "@/components/edition-covers";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { NormalizedBook } from "@/lib/book-types";

const apiGetMock = vi.fn();
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...actual, apiGet: (...args: unknown[]) => apiGetMock(...(args as [])) };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const editions: NormalizedBook[] = [
  { googleBooksId: "th", title: "ฉบับไทย", subtitle: null, authors: [], categories: [], isbn10: null, isbn13: null, coverUrl: null, publisher: null, publishedDate: "2018", description: null, pageCount: null, language: "th" },
  { googleBooksId: "en", title: "Crime and Punishment", subtitle: null, authors: [], categories: [], isbn10: null, isbn13: null, coverUrl: "https://books.google.com/en.jpg", publisher: null, publishedDate: "1968", description: null, pageCount: null, language: "en" },
];

function renderWith(props: Partial<Parameters<typeof EditionCovers>[0]> = {}) {
  return render(
    <I18nProvider initialLocale="th">
      <EditionCovers title="อาชญากรรมกับการลงทัณฑ์" currentGoogleBooksId="th" {...props} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  apiGetMock.mockReset().mockResolvedValue({ editions });
});

describe("EditionCovers", () => {
  it("แสดงปกทุกฉบับพร้อมปีและภาษา", async () => {
    renderWith();
    expect(await screen.findByText(/1968/)).toBeTruthy();
    expect(screen.getByText(/2018/)).toBeTruthy();
  });

  it("กดปกที่มีรูป → เรียก onPick ด้วย URL ปก", async () => {
    const onPick = vi.fn();
    renderWith({ onPick });
    const pickButton = await screen.findByRole("button", { name: /ปกฉบับ 1968/ });
    fireEvent.click(pickButton);
    expect(onPick).toHaveBeenCalledWith("https://books.google.com/en.jpg");
  });

  it("ปกที่เป็น placeholder กดเลือกไม่ได้", async () => {
    const onPick = vi.fn();
    renderWith({ onPick });
    await screen.findByRole("button", { name: /ปกฉบับ 1968/ });
    expect(screen.queryByRole("button", { name: /ปกฉบับ 2018/ })).toBeNull();
  });
});
