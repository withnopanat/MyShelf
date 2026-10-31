import { describe, expect, it } from "vitest";
import { isEmailAllowed } from "@/lib/email-allowlist";

describe("isEmailAllowed", () => {
  it("อนุญาตเมื่ออยู่ในรายชื่อ ALLOWED_EMAILS", () => {
    expect(isEmailAllowed("a@gmail.com", "a@gmail.com,b@gmail.com", "owner@x.com")).toBe(true);
  });

  it("case-insensitive และ trim space รอบ comma", () => {
    expect(isEmailAllowed("A@Gmail.com", " a@gmail.com , b@gmail.com ", "owner@x.com")).toBe(true);
  });

  it("ปฏิเสธเมื่อไม่อยู่ในรายชื่อ", () => {
    expect(isEmailAllowed("c@gmail.com", "a@gmail.com,b@gmail.com", "owner@x.com")).toBe(false);
  });

  it("ALLOWED_EMAILS ว่าง → ให้เฉพาะ AUTH_OWNER_EMAIL", () => {
    expect(isEmailAllowed("owner@x.com", "", "owner@x.com")).toBe(true);
    expect(isEmailAllowed("other@x.com", "", "owner@x.com")).toBe(false);
  });

  it("ทั้งคู่ว่าง → ปฏิเสธทุกราย", () => {
    expect(isEmailAllowed("owner@x.com", "", "")).toBe(false);
  });

  it("email เป็น null/undefined → ปฏิเสธ", () => {
    expect(isEmailAllowed(null, "a@gmail.com", "owner@x.com")).toBe(false);
    expect(isEmailAllowed(undefined, "a@gmail.com", "owner@x.com")).toBe(false);
  });

  it("owner ตรงแบบ case-insensitive", () => {
    expect(isEmailAllowed("Owner@X.com", "", "owner@x.com")).toBe(true);
  });
});
