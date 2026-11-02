import { describe, expect, it } from "vitest";
import { apiErrorMessage, type ApiError } from "@/lib/api-error";
import { dictionaries } from "@/lib/i18n/core";

describe("apiErrorMessage", () => {
  const th = dictionaries.th.errors;
  const en = dictionaries.en.errors;

  it("error ที่มี fallbackKey → แปลงเป็นข้อความตาม locale", () => {
    const error = new Error("errors.generic") as ApiError;
    error.fallbackKey = "errors.generic";
    expect(apiErrorMessage(error, th)).toBe(th.generic);
    expect(apiErrorMessage(error, en)).toBe(en.generic);
  });

  it("error จาก server (ข้อความจริง) → แสดงข้อความนั้นตรง ๆ", () => {
    const error = new Error("มีหนังสือเล่มนี้บนชั้นอยู่แล้ว");
    expect(apiErrorMessage(error, th)).toBe("มีหนังสือเล่มนี้บนชั้นอยู่แล้ว");
  });

  it("ไม่ใช่ Error / ไม่มี message → fallback ตาม locale", () => {
    expect(apiErrorMessage(undefined, th)).toBe(th.generic);
    expect(apiErrorMessage("boom", en)).toBe(en.generic);
  });
});
