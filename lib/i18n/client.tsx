"use client"

import { createContext, useContext } from "react"
import type { Dictionary, DictionaryKey } from "./get-dictionary"
import type { Locale } from "./locales"

interface I18nContextValue {
  locale: Locale
  dict: Dictionary
  t: (key: DictionaryKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Dictionary
  children: React.ReactNode
}) {
  const t = (
    key: DictionaryKey,
    vars?: Record<string, string | number>
  ) => {
    let val: string = dict[key] ?? key
    if (vars)
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v))
      })
    return val
  }

  return (
    <I18nContext.Provider value={{ locale, dict, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}
