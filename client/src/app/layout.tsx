import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { QueryProvider } from '@/components/layout/query-provider'
import { ChatWidget } from '@/components/chat/chat-widget'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Nhất Nướng - Hệ thống gọi món trực tuyến',
  description: 'Hệ thống menu điện tử và gọi món tại bàn cho nhà hàng Nhất Nướng',
}

// Khoa zoom tren mobile - giu kich thuoc UI co dinh
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <ChatWidget />
            <Toaster richColors position="top-right" duration={2000} />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
