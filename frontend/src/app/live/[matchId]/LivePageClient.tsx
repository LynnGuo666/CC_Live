/**
 * 直播页面客户端组件
 * 包含所有客户端逻辑和状态管理
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveStore } from '@/store/liveStore'
import { wsManager } from '@/utils/websocket'
import { LiveEventFeed } from '@/components/LiveEventFeed'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { PlayerDetailsPanel } from '@/components/PlayerDetailsPanel'
import { ChatSection } from '@/components/ChatSection'
import { StreamToggle } from '@/components/StreamToggle'
import { 
  Clock, 
  Users, 
  Gamepad2, 
  Wifi, 
  WifiOff, 
  ArrowLeft,
  RefreshCw,
  Monitor
} from 'lucide-react'

export default function LivePageClient() {
  const params = useParams()
  const matchId = params.matchId as string
  
  const {
    isConnected,
    match,
    matchStatus,
    events,
    playerScores,
    leaderboard,
    teamStats,
    comments,
    streamMode,
    setStreamMode,
    setCurrentMatch,
    clearData
  } = useLiveStore()

  const [isLoading, setIsLoading] = useState(true)

  // 初始化连接
  useEffect(() => {
    if (matchId) {
      setCurrentMatch(matchId)
      wsManager.connect(matchId)
      fetchMatchData()
    }

    return () => {
      wsManager.disconnect()
      clearData()
    }
  }, [matchId])

  // 设置连接状态监听
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false)
    }
  }, [isConnected])

  // 获取比赛基础数据
  const fetchMatchData = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`)
      if (response.ok) {
        const matchData = await response.json()
        useLiveStore.getState().setMatch(matchData)
      }
    } catch (error) {
      console.error('获取比赛数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 重新连接
  const handleReconnect = () => {
    setIsLoading(true)
    wsManager.disconnect()
    setTimeout(() => {
      wsManager.connect(matchId)
    }, 1000)
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen live-container flex items-center justify-center">
        <div className="text-center text-white">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">连接直播间中...</h2>
          <p className="text-white/80">正在建立WebSocket连接</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen live-container">
      {/* 顶部导航栏 */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-white hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-white">
                  {match?.title || `比赛 ${matchId}`}
                </h1>
                <div className="flex items-center space-x-4 text-white/80 text-sm">
                  <div className="flex items-center space-x-1">
                    <Gamepad2 className="w-4 h-4" />
                    <span>{match?.game_type || '小游戏'}</span>
                  </div>
                  
                  {matchStatus?.time_remaining && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>剩余: {formatTime(matchStatus.time_remaining)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{playerScores.length} 位玩家</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 连接状态 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-400" />
                    <span className="text-white text-sm">已连接</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-400" />
                    <span className="text-white text-sm">连接断开</span>
                    <button
                      onClick={handleReconnect}
                      className="text-white hover:text-white/80 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {streamMode === 'text' ? (
          // 文字直播模式
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：事件流和玩家数据 */}
            <div className="lg:col-span-2 space-y-6">
              <LiveEventFeed events={events} />
              <PlayerDetailsPanel playerScores={playerScores} />
            </div>

            {/* 右侧：排行榜、聊天、切换器 */}
            <div className="space-y-6">
              <LeaderboardPanel leaderboard={leaderboard} />
              <ChatSection 
                comments={comments} 
                isConnected={isConnected}
                className="min-h-[300px]"
              />
              <StreamToggle
                streamMode={streamMode}
                onModeChange={setStreamMode}
                bilibiliUrl={match?.bilibili_url}
              />
            </div>
          </div>
        ) : (
          // 视频直播模式
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 视频播放区域 */}
            <div className="lg:col-span-3">
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                {match?.bilibili_url ? (
                  <iframe
                    src={match.bilibili_url}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title="B站直播"
                  />
                ) : (
                  <div className="text-white text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">暂无视频直播</p>
                    <p className="text-sm opacity-75">请切换到文字直播模式</p>
                  </div>
                )}
              </div>
              
              {/* 视频模式下的简化信息面板 */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <LeaderboardPanel leaderboard={leaderboard.slice(0, 5)} />
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">比赛状态</h3>
                  {matchStatus ? (
                    <div className="space-y-2 text-sm">
                      <div>状态: <span className="font-medium">{matchStatus.status}</span></div>
                      <div>轮次: <span className="font-medium">{matchStatus.current_round}/{matchStatus.total_rounds}</span></div>
                      {matchStatus.time_remaining && (
                        <div>剩余时间: <span className="font-medium">{formatTime(matchStatus.time_remaining)}</span></div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">暂无状态信息</p>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：聊天和切换器 */}
            <div className="space-y-6">
              <ChatSection 
                comments={comments} 
                isConnected={isConnected}
                className="min-h-[400px]"
              />
              <StreamToggle
                streamMode={streamMode}
                onModeChange={setStreamMode}
                bilibiliUrl={match?.bilibili_url}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}