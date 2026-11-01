"use client";

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, LOCALE_COOKIE, type Dict, type Locale } from "@/lib/i18n/core";

type I18nContextValue = {
  locale: Locale;
  t: Dict;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      setLocaleState(next);
      startTransition(() => router.refresh());
    },
    [router],
  );

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
