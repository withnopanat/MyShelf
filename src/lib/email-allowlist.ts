/**
 * ตรวจว่าอีเมลได้รับอนุญาตให้ใช้งานหรือไม่
 * - `allowed`: รายชื่อคั่นด้วย comma (case-insensitive, trim อัตโนมัติ)
 * - `owner`: อีเมลเจ้าของระบบ — ใช้เมื่อ `allowed` ว่าง
 * - ทั้งคู่ว่าง → ปฏิเสธทุกราย (fail-closed)
 */
export function isEmailAllowed(
  email: string | null | undefined,
  allowed: string,
  owner: string,
): boolean {
  if (!email) return false;
  const target = email.trim().toLowerCase();

  const list = allowed
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (list.length > 0) return list.includes(target);
  if (owner.trim()) return owner.trim().toLowerCase() === target;
  return false;
}
