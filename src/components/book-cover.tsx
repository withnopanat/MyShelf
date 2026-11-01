"use client";

import { coverPlaceholder } from "@/lib/cover";
import { cn } from "@/lib/utils";

// Tailwind ไม่รู้จักสี sage เอง — ใช้ emerald/stone ใกล้เคียงแทน
const FALLBACK_GRADIENTS = [
  "from-emerald-100 to-emerald-300 dark:from-emerald-900 dark:to-emerald-700",
  "from-amber-100 to-amber-300 dark:from-amber-900 dark:to-amber-700",
  "from-rose-100 to-rose-300 dark:from-rose-900 dark:to-rose-700",
  "from-sky-100 to-sky-300 dark:from-sky-900 dark:to-sky-700",
  "from-lime-100 to-lime-300 dark:from-lime-900 dark:to-lime-700",
  "from-stone-200 to-stone-400 dark:from-stone-700 dark:to-stone-500",
];

export function BookCover({
  title,
  coverUrl,
  className,
}: {
  title: string;
  coverUrl: string | null;
  className?: string;
}) {
  if (coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={coverUrl} alt="" className={cn("object-cover", className)} loading="lazy" />;
  }
  const idx = coverPlaceholder(title);
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br p-2 text-center",
        FALLBACK_GRADIENTS[idx],
        className,
      )}
      aria-label={`ปกหนังสือ ${title}`}
    >
      <span className="line-clamp-3 text-sm font-semibold text-stone-700 dark:text-stone-200">
        {title}
      </span>
    </div>
  );
}
