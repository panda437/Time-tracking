import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import GoogleAnalytics from "@/components/GoogleAnalytics"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://time-track.vercel.app'),
  title: "TimeTrack - Personal Time Tracking Made Beautiful",
  description: "Transform how you understand your time with TimeTrack. Beautiful, intuitive time tracking with mood insights, calendar views, and Pomodoro timer. Track your life's story, one moment at a time.",
  keywords: "time tracking, productivity, personal time tracker, mood tracking, calendar, pomodoro timer, time management, daily habits, life tracking",
  authors: [{ name: "TimeTrack" }],
  creator: "TimeTrack",
  publisher: "TimeTrack",
  robots: "index, follow",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://time-track.vercel.app",
    title: "TimeTrack - Personal Time Tracking Made Beautiful",
    description: "Transform how you understand your time with TimeTrack. Beautiful, intuitive time tracking with mood insights, calendar views, and Pomodoro timer.",
    siteName: "TimeTrack",
    images: [
      {
        url: "/time.jpg",
        width: 1200,
        height: 630,
        alt: "TimeTrack - Personal Time Tracking App",
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "TimeTrack - Personal Time Tracking Made Beautiful",
    description: "Transform how you understand your time with beautiful, intuitive time tracking.",
    images: ["/time.jpg"],
    creator: "@timetrack",
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Verification
  verification: {
    google: "google-site-verification-id", // You can add this later
  },
  
  // App-specific
  category: "productivity",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] min-h-screen`}
      >
        <GoogleAnalytics />
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA]/50 via-transparent to-[#EBEBEB]/30">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
