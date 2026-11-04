"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Book3D } from "@/components/book-3d";
import { BookCover } from "@/components/book-cover";
import { AddToShelfButton } from "@/components/add-to-shelf-button";
import { EmptyState } from "@/components/empty-state";
import { apiPost, type ShelfBook } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { apiErrorMessage } from "@/lib/api-error";
import type { NormalizedBook } from "@/lib/book-types";

type CatalogBook = ShelfBook & { backCoverUrl?: string | null };

export function CatalogClient({ books }: { books: CatalogBook[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("");

  const sync = async () => {
    setSyncing(true);
    try {
      const counts = await apiPost<{ created: number; updated: number }>("/api/catalog", {}, "errors.generic");
      toast.success(t.catalog.syncDone.replace("{created}", String(counts.created)).replace("{updated}", String(counts.updated)));
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
    } finally {
      setSyncing(false);
    }
  };

  const toNormalized = (b: CatalogBook): NormalizedBook => ({
    googleBooksId: null,
    title: b.title,
    subtitle: b.subtitle,
    authors: b.authors,
    categories: b.categories,
    isbn10: b.isbn10,
    isbn13: b.isbn13,
    coverUrl: b.coverUrl,
    backCoverUrl: b.backCoverUrl ?? null,
    publisher: b.publisher,
    publishedDate: b.publishedDate,
    description: b.description,
    pageCount: b.pageCount,
    language: "th",
  });

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.authors.some((a) => a.toLowerCase().includes(q)),
    );
  }, [books, filter]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold">{t.catalog.title}</h1>
        <div className="flex gap-2 sm:ml-auto">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.catalog.search}
            className="sm:w-56"
          />
          <Button variant="outline" onClick={sync} disabled={syncing || pending}>
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {syncing ? t.catalog.syncing : t.catalog.sync}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState title={books.length === 0 ? t.catalog.empty : t.search.noResults} description={t.catalog.emptyHint} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3">
                <div className="flex items-end justify-center h-32">
                  {b.pageCount ? (
                    <Book3D title={b.title} coverUrl={b.coverUrl} pages={b.pageCount} size="sm" />
                  ) : (
                    <BookCover title={b.title} coverUrl={b.coverUrl} className="h-28 w-20 rounded-md shadow-sm" />
                  )}
                </div>
                <div className="w-full text-center">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug">{b.title}</p>
                  {b.pageCount && <p className="mt-0.5 text-[10px] text-muted-foreground">{b.pageCount} หน้า</p>}
                </div>
                <AddToShelfButton book={toNormalized(b)} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
