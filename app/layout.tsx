import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './leaflet.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WiFi Map - Find Free WiFi Hotspots',
  description: 'Crowdsourced map of free WiFi hotspots with passwords',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

