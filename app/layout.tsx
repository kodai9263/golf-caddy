import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ゴルフキャディ',
  description: 'AIがクラブ選択をサポートするゴルフキャディアプリ',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ゴルフキャディ',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
