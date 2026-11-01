/** index 0-5 สำหรับเลือกสี gradient ของปก placeholder จากตัวอักษรแรกของชื่อเรื่อง — client-safe */
export function coverPlaceholder(title: string): number {
  const first = title.trim().charCodeAt(0) || 0;
  return first % 6;
}
