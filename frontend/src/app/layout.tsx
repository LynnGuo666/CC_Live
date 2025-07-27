import './globals.css'
import type { Metadata } from 'next'

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
    <html lang="zh-CN">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}