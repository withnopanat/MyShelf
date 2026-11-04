// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookInfoModal } from "@/components/book-info-modal";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { NormalizedBook } from "@/lib/book-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    apiGet: vi.fn().mockResolvedValue({ editions: [] }),
  };
});

const book: NormalizedBook = {
  googleBooksId: "v1",
  title: "The Seven Year Slip",
  subtitle: null,
  authors: ["Ashley Poston"],
  categories: ["Fiction"],
  isbn10: "0008646228",
  isbn13: "9780008646226",
  coverUrl: "https://example.com/c.jpg",
  publisher: "HarperCollins",
  publishedDate: "2023-06-27",
  description: "A magical romance about love and time.",
  pageCount: 352,
  language: "en",
};

function renderModal(props: Partial<Parameters<typeof BookInfoModal>[0]> = {}) {
  return render(
    <I18nProvider initialLocale="th">
      <BookInfoModal book={book} open onOpenChange={() => {}} {...props} />
    </I18nProvider>,
  );
}

describe("BookInfoModal", () => {
  it("แสดงสำนักพิมพ์ ปี จำนวนหน้า และคำอธิบาย", () => {
    renderModal();
    expect(screen.getByText("HarperCollins")).toBeTruthy();
    expect(screen.getByText("2023")).toBeTruthy();
    expect(screen.getByText("352")).toBeTruthy();
    expect(screen.getByText(/A magical romance/)).toBeTruthy();
    expect(screen.getByText("Ashley Poston")).toBeTruthy();
  });

  it("มีปุ่มเพิ่มเข้าชั้นเมื่อยังไม่อยู่บนชั้น", () => {
    renderModal();
    expect(screen.getAllByText("เพิ่มเข้าชั้น").length).toBeGreaterThan(0);
  });

  it("อยู่บนชั้นแล้ว → แสดง badge สถานะแทนปุ่มเพิ่ม", () => {
    renderModal({ onShelfStatus: "READ" });
    expect(screen.getByText("อ่านแล้ว")).toBeTruthy();
  });
});
