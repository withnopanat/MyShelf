import { describe, expect, it } from "vitest";
import { toProxyCoverUrl, COVER_HOSTS } from "@/lib/cover-proxy";

describe("toProxyCoverUrl", () => {
  it("host ใน allowlist → คืน URL proxy", () => {
    for (const host of COVER_HOSTS) {
      const u = `https://${host}/some/cover.jpg`;
      expect(toProxyCoverUrl(u)).toBe(`/api/cover-proxy?url=${encodeURIComponent(u)}`);
    }
  });

  it("host แปลกหน้า → null (กัน SSRF)", () => {
    expect(toProxyCoverUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(toProxyCoverUrl("https://evil.example.com/cover.jpg")).toBeNull();
  });

  it("null/empty → null", () => {
    expect(toProxyCoverUrl(null)).toBeNull();
    expect(toProxyCoverUrl("")).toBeNull();
  });
});
