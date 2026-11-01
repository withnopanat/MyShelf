import { afterEach, describe, expect, it, vi } from "vitest";
import { isBarcodeSupported } from "@/lib/barcode";

afterEach(() => vi.unstubAllGlobals());

describe("isBarcodeSupported", () => {
  it("ไม่มี BarcodeDetector → false", () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    expect(isBarcodeSupported()).toBe(false);
  });

  it("มี BarcodeDetector → true", () => {
    vi.stubGlobal("BarcodeDetector", class {});
    expect(isBarcodeSupported()).toBe(true);
  });
});
