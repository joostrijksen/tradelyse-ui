import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tradelyse',
  description: 'A serious trading journal with zero extra effort.',
  icons: {
    icon: '/favicon.png',          // standaard favicon
    shortcut: '/favicon.png',
    apple: '/favicon.png',         // iOS icon
  },
  metadataBase: new URL('https://tradelyse.com'),
  openGraph: {
    title: 'Tradelyse – Trading journal',
    description: 'A serious trading journal with zero extra effort.',
    url: 'https://tradelyse.com',
    siteName: 'Tradelyse',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  )
}