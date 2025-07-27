import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Minecraft锦标赛直播',
  description: 'Minecraft文字锦标赛实时直播平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}