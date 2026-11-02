import type { Dict } from "@/lib/i18n/core";

export type ApiError = Error & { fallbackKey?: string };

/**
 * แปลง error จาก api-client เป็นข้อความที่ผู้ใช้อ่านได้ตาม locale
 * - error ที่ api-client โยนเองจะแนบ fallbackKey → ใช้ dictionary
 * - error ที่มาจาก server (ข้อความจริงจาก API) → แสดงตรง ๆ
 */
export function apiErrorMessage(error: unknown, errors: Dict["errors"]): string {
  if (error instanceof Error && error.message) {
    const withKey = error as ApiError;
    if (withKey.fallbackKey) {
      const key = withKey.fallbackKey.replace(/^errors\./, "") as keyof Dict["errors"];
      return errors[key] ?? error.message;
    }
    return error.message;
  }
  return errors.generic;
}
