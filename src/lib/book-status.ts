import type { BookStatus } from "@/generated/prisma/client";

export const BOOK_STATUSES: BookStatus[] = ["WANT_TO_READ", "READING", "READ"];

/** Tailwind classes ของ badge ต่อสถานะ */
export const STATUS_COLORS: Record<BookStatus, string> = {
  WANT_TO_READ: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  READING: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  READ: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};
