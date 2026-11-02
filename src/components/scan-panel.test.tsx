// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanPanel } from "@/components/scan-panel";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api-client", () => ({
  apiGet: vi.fn().mockResolvedValue({ book: null }),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

function renderPanel() {
  return render(
    <I18nProvider initialLocale="th">
      <ScanPanel />
    </I18nProvider>,
  );
}

describe("ScanPanel camera scan", () => {
  it("กดปุ่มสแกนแล้วต้องมี <video> element ใน DOM (ref ต้องไม่ตาย)", async () => {
    // จำลองเบราว์เซอร์ที่รองรับ BarcodeDetector + กล้อง
    vi.stubGlobal("BarcodeDetector", class {
      detect = vi.fn().mockResolvedValue([]);
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: () => Promise.resolve({ getTracks: () => [] }) },
      configurable: true,
    });

    renderPanel();
    const scanButton = await screen.findByRole("button", { name: "สแกน ISBN" });
    fireEvent.click(scanButton);

    expect(document.querySelector("video")).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
