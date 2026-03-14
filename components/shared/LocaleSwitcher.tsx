"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/locales"
import { useTranslation } from "@/lib/i18n/client"

export function LocaleSwitcher() {
  const router = useRouter()
  const { locale } = useTranslation()

  function handleChange(value: string) {
    document.cookie = `NEXT_LOCALE=${value};path=/;max-age=31536000;samesite=lax`
    router.refresh()
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>{LOCALE_LABELS[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {LOCALE_LABELS[loc as Locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
