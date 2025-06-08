import type React from "react"
import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const openSans = Open_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Learnsy - Distraction-Free YouTube Learning",
  description: "A modern, distraction-free YouTube-based study platform",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon.png", sizes: "120x120", type: "image/png" },
      { url: "/favicon.png", sizes: "114x114", type: "image/png" },
      { url: "/favicon.png", sizes: "76x76", type: "image/png" },
      { url: "/favicon.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon.png", sizes: "60x60", type: "image/png" },
      { url: "/favicon.png", sizes: "57x57", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.png",
        color: "#3b82f6",
      },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts - Space Grotesk */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Primary favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon.png" />

        {/* Android Chrome Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />

        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/favicon.png" color="#3b82f6" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Theme colors */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={openSans.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
