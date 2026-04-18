import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { getLocale } from "@/lib/i18n/server"
import "./globals.css"

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
})

export const metadata: Metadata = {
  title: {
    default: "SpaceOps - Facility Management & Quality Control Platform",
    template: "%s | SpaceOps",
  },
  description:
    "Streamline janitorial operations with real-time inspections, scheduling, attendance tracking, and automated quality reports. Built for facility managers and cleaning service providers.",
  keywords: [
    "facility management",
    "janitorial services",
    "quality control",
    "building inspections",
    "cleaning management",
    "space operations",
    "facility maintenance",
    "cleaning schedule",
    "inspection reports",
    "attendance tracking",
  ],
  authors: [{ name: "SpaceOps" }],
  creator: "SpaceOps",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://onyxspaceops.com"
  ),
  openGraph: {
    type: "website",
    siteName: "SpaceOps",
    title: "SpaceOps - Facility Management & Quality Control Platform",
    description:
      "Streamline janitorial operations with real-time inspections, scheduling, attendance tracking, and automated quality reports.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpaceOps - Facility Management & Quality Control Platform",
    description:
      "Streamline janitorial operations with real-time inspections, scheduling, attendance tracking, and automated quality reports.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} font-[family-name:var(--font-geist)] antialiased`}
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
