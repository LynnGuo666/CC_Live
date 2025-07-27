/**
 * 主直播页面
 * 整合所有组件，提供完整的直播观看体验
 */

import React from 'react'
import LivePageClient from './LivePageClient'

// 为静态导出生成静态参数
export async function generateStaticParams() {
  // 返回一个默认的参数，支持动态路由
  return [{ matchId: 'default' }]
}

export default function LivePage() {
  return <LivePageClient />
}