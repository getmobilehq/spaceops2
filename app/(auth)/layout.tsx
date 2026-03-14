import { I18nProvider } from "@/lib/i18n/client"
import { getLocale } from "@/lib/i18n/server"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getLocale()
  const dict = await getDictionary(locale)

  return (
    <I18nProvider locale={locale} dict={dict}>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </I18nProvider>
  )
}
