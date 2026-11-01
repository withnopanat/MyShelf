import { describe, expect, it } from "vitest";
import { dictionaries, normalizeLocale, type Dict } from "@/lib/i18n/core";

describe("dictionaries", () => {
  it("en มี key ครบตาม th (TS ตรวจผ่าน satisfies Dict)", () => {
    const th: Dict = dictionaries.th;
    const en: Dict = dictionaries.en;
    expect(Object.keys(en).sort()).toEqual(Object.keys(th).sort());
  });

  it("label สถานะภาษาไทยถูกต้อง", () => {
    expect(dictionaries.th.status.WANT_TO_READ).toBe("อยากอ่าน");
    expect(dictionaries.th.status.READING).toBe("กำลังอ่าน");
    expect(dictionaries.th.status.READ).toBe("อ่านแล้ว");
  });

  it("label สถานะภาษาอังกฤษถูกต้อง", () => {
    expect(dictionaries.en.status.WANT_TO_READ).toBe("Want to read");
    expect(dictionaries.en.status.READING).toBe("Reading");
    expect(dictionaries.en.status.READ).toBe("Read");
  });
});

describe("normalizeLocale", () => {
  it("cookie 'en' → en", () => {
    expect(normalizeLocale("en")).toBe("en");
  });
  it("cookie 'th' → th", () => {
    expect(normalizeLocale("th")).toBe("th");
  });
  it("ค่ามั่ว → th (default)", () => {
    expect(normalizeLocale("jp")).toBe("th");
    expect(normalizeLocale(null)).toBe("th");
  });
});
