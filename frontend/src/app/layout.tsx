import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MC小游戏比赛直播系统',
  description: '观看实时MC小游戏比赛直播，查看玩家数据和排行榜',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}