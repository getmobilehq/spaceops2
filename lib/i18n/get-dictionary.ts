import type { Locale } from "./locales"
import type { Dictionary, DictionaryKey } from "./dictionaries/en"

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.default),
  es: () => import("./dictionaries/es").then((m) => m.default),
  fr: () => import("./dictionaries/fr").then((m) => m.default),
}

export type { Dictionary, DictionaryKey }

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
