"use client";

import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/book-cover";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { STATUS_COLORS } from "@/lib/book-status";
import type { NormalizedBook } from "@/lib/book-types";
import type { BookStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  book: NormalizedBook;
  onShelfStatus?: BookStatus | null;
  onClick?: () => void;
};

export function BookCard({ book, onShelfStatus, onClick }: Props) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-3 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <BookCover
          title={book.title}
          coverUrl={book.coverUrl}
          className="h-32 w-22 shrink-0 rounded-md shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
          {book.authors.length > 0 && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {book.authors.join(", ")}
            </p>
          )}
          {book.publishedDate && (
            <p className="mt-1 text-xs text-muted-foreground/70">{book.publishedDate}</p>
          )}
        </div>
      </div>
      {onShelfStatus && (
        <Badge className={cn("w-fit border-transparent", STATUS_COLORS[onShelfStatus])}>
          {t.status[onShelfStatus]}
        </Badge>
      )}
    </button>
  );
}
