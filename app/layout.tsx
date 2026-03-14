import type { Metadata } from "next"
import { Public_Sans } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { getLocale } from "@/lib/i18n/server"
import "./globals.css"

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-public-sans",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "SpaceOps",
  description: "Quality control for janitorial services",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${publicSans.variable} ${geistMono.variable} font-[family-name:var(--font-public-sans)] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
