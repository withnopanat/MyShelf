"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Book3D } from "@/components/book-3d";
import { EditionCovers } from "@/components/edition-covers";
import { AddToShelfButton } from "@/components/add-to-shelf-button";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { STATUS_COLORS } from "@/lib/book-status";
import type { NormalizedBook } from "@/lib/book-types";
import type { BookStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  book: NormalizedBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ถ้าเล่มนี้อยู่บนชั้นแล้ว → แสดง badge แทนปุ่มเพิ่ม */
  onShelfStatus?: BookStatus | null;
  onAdded?: (status: BookStatus) => void;
};

/** รายละเอียดหนังสือจากผลค้นหา (ยังไม่ผูกกับชั้น) — ปก, ข้อมูลเล่ม, ปกฉบับอื่น */
export function BookInfoModal({ book, open, onOpenChange, onShelfStatus, onAdded }: Props) {
  const { t } = useI18n();
  if (!book) return null;

  const info: Array<[string, string | undefined]> = [
    [t.detail.publisher, book.publisher ?? undefined],
    [t.detail.publishedDate, book.publishedDate?.slice(0, 4) || book.publishedDate || undefined],
    [t.detail.pageCount, book.pageCount ? String(book.pageCount) : undefined],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left">{book.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:flex-row">
          <Book3D
            title={book.title}
            coverUrl={book.coverUrl}
            pages={book.pageCount}
            size="lg"
            className="shrink-0 self-center sm:self-start"
          />
          <div className="min-w-0 flex-1 space-y-4">
            {book.authors.length > 0 && (
              <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
            )}

            {onShelfStatus ? (
              <Badge className={cn("w-fit border-transparent", STATUS_COLORS[onShelfStatus])}>
                {t.status[onShelfStatus]}
              </Badge>
            ) : (
              <AddToShelfButton book={book} onAdded={onAdded} />
            )}

            <dl className="space-y-1 text-sm">
              {info.map(([label, value]) =>
                value ? (
                  <div key={label} className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>

            {book.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {book.categories.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <EditionCovers title={book.title} currentGoogleBooksId={book.googleBooksId} />

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{t.detail.description}</p>
          <p className="text-sm leading-relaxed">{book.description ?? t.detail.noDescription}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
