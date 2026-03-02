import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { FathomAnalytics } from "./fathom"
import Navbar from "@/components/ui/nav-bar"
import { Footer } from "@/components/ui/footer"
import "./globals.css"

const inter = localFont({
  src: "../../public/fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Theta Tau Xi Chapter | Professional Engineering Fraternity",
  description:
    "Join Theta Tau Xi - a premier engineering fraternity dedicated to academic excellence, professional development, and lifelong brotherhood.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-gray-900 focus-visible:shadow-lg"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
        <FathomAnalytics />
      </body>
    </html>
  )
}
