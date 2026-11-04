// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Book3D } from "@/components/book-3d";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
import { vi } from "vitest";

function render3d(props: Partial<Parameters<typeof Book3D>[0]> = {}) {
  return render(
    <I18nProvider initialLocale="th">
      <Book3D title="ในกรงแก้ว" coverUrl="https://x/c.jpg" pages={330} size="sm" {...props} />
    </I18nProvider>,
  );
}

describe("Book3D", () => {
  it("มีปีกหนังสือ (spine) และขอบกระดาษ พร้อมความหนาคำนวณจากจำนวนหน้า", () => {
    const { container } = render3d();
    const spine = container.querySelector('[data-testid="book3d-spine"]') as HTMLElement;
    const pages = container.querySelector('[data-testid="book3d-pages"]') as HTMLElement;
    expect(spine).toBeTruthy();
    expect(pages).toBeTruthy();
    const w = Number.parseInt(spine.style.width);
    expect(w).toBeGreaterThan(5);
    // 330 หน้า ~ 40mm → หนาขึ้นกับสเกล ต้องหนากว่า 100 หน้า
    const { container: thin } = render(
      <I18nProvider initialLocale="th">
        <Book3D title="บาง" coverUrl="https://x/c.jpg" pages={100} size="sm" />
      </I18nProvider>,
    );
    const thinSpine = thin.querySelector('[data-testid="book3d-spine"]') as HTMLElement;
    expect(Number.parseInt(spine.style.width)).toBeGreaterThan(Number.parseInt(thinSpine.style.width));
  });

  it("ความหนาเพดาน 45 มม. (900 หน้า → 45 × mmPerPx)", () => {
    const { container } = render3d({ pages: 900 });
    const spine = container.querySelector('[data-testid="book3d-spine"]') as HTMLElement;
    // size sm: w=80px / 130mm → 45 มม. ≈ 28px
    expect(Number.parseInt(spine.style.width)).toBe(Math.round(45 * (80 / 130)));
  });

  it("ปรับมุมหมุนได้ด้วย prop rotationAngle และมี hover angle ใน CSS var", () => {
    const { container } = render3d({ rotationAngle: -14, hoverAngle: -5 });
    const inner = container.querySelector('[data-testid="book3d-inner"]') as HTMLElement;
    expect(inner.style.getPropertyValue("--book3d-angle")).toBe("-14deg");
    expect(inner.style.getPropertyValue("--book3d-angle-hover")).toBe("-5deg");
    expect(inner.classList.contains("book3d-inner")).toBe(true);
  });

  it("ไม่มีจำนวนหน้า → ใช้ความหนาค่าเริ่มต้นและยัง render ได้", () => {
    const { container } = render3d({ pages: null });
    expect(container.querySelector('[data-testid="book3d-spine"]')).toBeTruthy();
    expect(container.querySelector("img")).toBeTruthy();
  });
});
