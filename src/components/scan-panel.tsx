"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard } from "@/components/book-card";
import { AddToShelfButton } from "@/components/add-to-shelf-button";
import { EmptyState } from "@/components/empty-state";
import { ManualBookForm } from "@/components/manual-book-form";
import { apiGet } from "@/lib/api-client";
import { isBarcodeSupported, startScan } from "@/lib/barcode";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { NormalizedBook } from "@/lib/book-types";
import type { BookStatus } from "@/generated/prisma/client";

type LookupResult =
  | { kind: "on-shelf"; item: { id: string; status: BookStatus }; book: NormalizedBook }
  | { kind: "available"; book: NormalizedBook }
  | { kind: "not-found"; isbn: string };

export function ScanPanel() {
  const { t } = useI18n();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    setSupported(isBarcodeSupported());
    return () => stopRef.current?.();
  }, []);

  const lookup = async (isbn: string) => {
    setResult(null);
    setChecking(true);
    try {
      // ดูก่อนว่ามีบนชั้นไหม (จาก cache) แล้วค่อยเรียก Google Books
      const data = await apiGet<{ book: NormalizedBook | null }>(
        `/api/books/isbn/${encodeURIComponent(isbn)}`,
        t.errors.searchFailed,
      );
      if (!data.book) {
        setResult({ kind: "not-found", isbn });
        return;
      }
      const shelf = await apiGet<{ items: Array<{ id: string; status: BookStatus; book: { googleBooksId: string | null } }> }>(
        "/api/shelf",
      );
      const match = data.book.googleBooksId
        ? shelf.items.find((i) => i.book.googleBooksId === data.book!.googleBooksId)
        : undefined;
      setResult(
        match
          ? { kind: "on-shelf", item: { id: match.id, status: match.status }, book: data.book }
          : { kind: "available", book: data.book },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setChecking(false);
    }
  };

  const beginScan = () => {
    if (!videoRef.current) return;
    setScanning(true);
    stopRef.current = startScan(
      videoRef.current,
      (isbn) => {
        stopRef.current?.();
        stopRef.current = null;
        setScanning(false);
        void lookup(isbn);
      },
      () => {
        setScanning(false);
        toast.error(t.errors.generic);
      },
    );
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setScanning(false);
  };

  const submitIsbn = (e: React.FormEvent) => {
    e.preventDefault();
    if (isbnInput.trim()) void lookup(isbnInput.trim());
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ScanLine className="h-5 w-5 text-primary" />
        {t.home.scanButton}
      </h2>

      {scanning && (
        <div className="mt-4">
          <video ref={videoRef} className="w-full max-w-sm rounded-lg" playsInline muted />
          <p className="mt-2 text-sm text-muted-foreground">{t.home.scanning}</p>
          <Button variant="outline" className="mt-2" onClick={stop}>
            {t.home.stopScan}
          </Button>
        </div>
      )}

      {!scanning && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {supported && (
            <Button onClick={beginScan}>{t.home.scanButton}</Button>
          )}
          <form onSubmit={submitIsbn} className="flex gap-2 sm:flex-1">
            <Input
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              placeholder={t.home.manualIsbn}
              inputMode="numeric"
              className="sm:max-w-xs"
            />
            <Button type="submit" variant="outline" disabled={checking}>
              {t.home.checkIsbn}
            </Button>
          </form>
        </div>
      )}

      <div className="mt-5">
        {checking ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : result?.kind === "on-shelf" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <BookCard book={result.book} onShelfStatus={result.item.status} />
            </div>
            <Button variant="outline" asChild>
              <a href="/shelf">{t.home.goShelf}</a>
            </Button>
          </div>
        ) : result?.kind === "available" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <BookCard book={result.book} />
            </div>
            <AddToShelfButton
              book={result.book}
              onAdded={() => {
                setResult(null);
                setIsbnInput("");
                router.refresh();
              }}
            />
          </div>
        ) : result?.kind === "not-found" ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8">
            <p className="text-base font-medium">{t.home.notFound}</p>
            <p className="text-sm text-muted-foreground">{result.isbn}</p>
            <Button variant="outline" size="sm" onClick={() => setManualOpen(true)}>
              {t.home.addManual}
            </Button>
            <ManualBookForm
              open={manualOpen}
              onOpenChange={setManualOpen}
              defaultIsbn={result.isbn}
              onCreated={() => {
                setResult(null);
                setIsbnInput("");
                router.refresh();
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
