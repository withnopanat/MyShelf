"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCard } from "@/components/book-card";
import { AddToShelfButton } from "@/components/add-to-shelf-button";
import { BookInfoModal } from "@/components/book-info-modal";
import { EmptyState } from "@/components/empty-state";
import { searchBooksClient, fetchShelf } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { apiErrorMessage } from "@/lib/api-error";
import type { NormalizedBook } from "@/lib/book-types";
import type { BookStatus } from "@/generated/prisma/client";

const TYPES = ["text", "author", "category", "isbn"] as const;

export function SearchClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState<string>(searchParams.get("type") ?? "text");
  const [results, setResults] = useState<NormalizedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [detailBook, setDetailBook] = useState<NormalizedBook | null>(null);
  const [shelfStatuses, setShelfStatuses] = useState<Map<string, BookStatus>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // เช็กว่าเล่มไหนอยู่บนชั้นแล้ว (สเกลเล็ก — โหลดชั้นทั้งหมดครั้งเดียว)
  useEffect(() => {
    fetchShelf()
      .then((items) => {
        const map = new Map<string, BookStatus>();
        for (const item of items) {
          if (item.book.googleBooksId) map.set(item.book.googleBooksId, item.status);
        }
        setShelfStatuses(map);
      })
      .catch(() => undefined);
  }, []);

  const runSearch = useMemo(
    () => async (q: string, searchType: string) => {
      if (!q.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      try {
        const books = await searchBooksClient(q.trim(), searchType);
        setResults(books);
        setSearched(true);
      } catch (error) {
        setResults([]);
        setSearched(true);
        import("sonner").then(({ toast }) =>
          toast.error(apiErrorMessage(error, t.errors)),
        );
      } finally {
        setLoading(false);
      }
    },
    [t.errors.searchFailed],
  );

  // debounce 400ms ตามแผน
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, type), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type, runSearch]);

  const typeLabels: Record<string, string> = {
    text: t.search.typeAll,
    author: t.search.typeAuthor,
    category: t.search.typeCategory,
    isbn: t.search.typeIsbn,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((key) => (
              <SelectItem key={key} value={key}>
                {typeLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t.common.loading}</p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((book) => (
              <div key={book.googleBooksId ?? book.isbn13 ?? book.title} className="flex flex-col gap-2">
                <BookCard
                  book={book}
                  onShelfStatus={
                    book.googleBooksId ? shelfStatuses.get(book.googleBooksId) ?? null : null
                  }
                  onClick={() => setDetailBook(book)}
                />
                <AddToShelfButton
                  book={book}
                  compact
                  onAdded={(status) => {
                    if (book.googleBooksId) {
                      setShelfStatuses((prev) => new Map(prev).set(book.googleBooksId!, status));
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={searched ? t.search.noResults : t.search.empty}
          />
        )}
      </div>

      <BookInfoModal
        book={detailBook}
        open={detailBook !== null}
        onOpenChange={(next) => !next && setDetailBook(null)}
        onShelfStatus={
          detailBook?.googleBooksId ? shelfStatuses.get(detailBook.googleBooksId) ?? null : null
        }
        onAdded={(status) => {
          if (detailBook?.googleBooksId) {
            setShelfStatuses((prev) => new Map(prev).set(detailBook.googleBooksId!, status));
          }
        }}
      />
    </div>
  );
}
