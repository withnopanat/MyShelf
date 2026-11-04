"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { BookCover } from "@/components/book-cover";
import type { NormalizedBook } from "@/lib/book-types";

/**
 * แกลเลอรีปกจากทุกฉบับพิมพ์ เรียงตามปีที่พิมพ์ (API เรียงให้แล้ว)
 * มี onPick → กดปกที่มีรูปเพื่อตั้งเป็นปกหลักของเล่ม (บันทึกถาวร)
 */
export function EditionCovers({
  title,
  currentGoogleBooksId,
  onPick,
}: {
  title: string;
  currentGoogleBooksId: string | null;
  onPick?: (coverUrl: string) => void;
}) {
  const { t } = useI18n();
  const [editions, setEditions] = useState<NormalizedBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEditions(null);
    apiGet<{ editions: NormalizedBook[] }>(
      `/api/books/editions?title=${encodeURIComponent(title)}`,
      "errors.generic",
    )
      .then((data) => {
        if (!cancelled) setEditions(data.editions);
      })
      .catch(() => {
        if (!cancelled) setEditions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [title]);

  if (editions === null) {
    return <p className="text-xs text-muted-foreground">{t.common.loading}</p>;
  }
  if (editions.length <= 1) return null;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t.detail.otherEditions}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {editions.map((edition) => {
          const label = `ปกฉบับ ${edition.publishedDate?.slice(0, 4) ?? "—"}${edition.language ? ` · ${edition.language.toUpperCase()}` : ""}`;
          const pickable = !!onPick && !!edition.coverUrl;
          const inner = (
            <>
              <BookCover
                title={edition.title}
                coverUrl={edition.coverUrl}
                className={`h-24 w-16 rounded shadow-sm ${
                  edition.googleBooksId === currentGoogleBooksId ? "ring-2 ring-primary" : ""
                }`}
              />
              <p className="mt-1 text-center text-[10px] leading-tight text-muted-foreground">
                {label}
              </p>
            </>
          );
          return pickable ? (
            <button
              key={edition.googleBooksId ?? edition.isbn13 ?? edition.title}
              type="button"
              aria-label={label}
              title={t.detail.pickCover}
              className="w-16 shrink-0 transition-opacity hover:opacity-80"
              onClick={() => onPick?.(edition.coverUrl!)}
            >
              {inner}
            </button>
          ) : (
            <div key={edition.googleBooksId ?? edition.isbn13 ?? edition.title} className="w-16 shrink-0">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
