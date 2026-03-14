import { cookies, headers } from "next/headers"
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales"
import { getDictionary, type DictionaryKey } from "./get-dictionary"

export function getLocale(): Locale {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value
  if (cookieLocale && LOCALES.includes(cookieLocale as Locale))
    return cookieLocale as Locale

  const headerLocale = headers().get("x-locale")
  if (headerLocale && LOCALES.includes(headerLocale as Locale))
    return headerLocale as Locale

  return DEFAULT_LOCALE
}

export async function getTranslations() {
  const locale = getLocale()
  const dict = await getDictionary(locale)

  return {
    locale,
    t: (key: DictionaryKey, vars?: Record<string, string | number>) => {
      let val: string = dict[key] ?? key
      if (vars)
        Object.entries(vars).forEach(([k, v]) => {
          val = val.replace(`{${k}}`, String(v))
        })
      return val
    },
  }
}
