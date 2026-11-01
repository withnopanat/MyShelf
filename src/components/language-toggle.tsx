"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2 font-medium"
      aria-label="Switch language"
      onClick={() => setLocale(locale === "th" ? "en" : "th")}
    >
      {locale === "th" ? "EN" : "TH"}
    </Button>
  );
}
