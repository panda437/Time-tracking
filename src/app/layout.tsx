import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TimeTrack - Personal Time Tracker",
  description: "Track your time and see how you spend your days",
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
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA]/50 via-transparent to-[#EBEBEB]/30">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
