'use client'

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useTournamentData } from '@/hooks/useTournamentData'
import TournamentHeader from '@/components/TournamentHeader'
import LeaderboardPanel from '@/components/LeaderboardPanel'
import LiveEventFeed from '@/components/LiveEventFeed'
import ChatSection from '@/components/ChatSection'
import GameDisplay from '@/components/GameDisplay'
import VotingInterface from '@/components/VotingInterface'

export default function Home() {
  const { tournament, leaderboard, isLoading, refreshData } = useTournamentData()
  const { 
    isConnected, 
    events, 
    scores, 
    gameStatus, 
    viewerCount, 
    votingData 
  } = useWebSocket('ws://localhost:8000/ws/live')

  const [showVoting, setShowVoting] = useState(false)

  useEffect(() => {
    // 每10秒刷新一次数据
    const interval = setInterval(refreshData, 10000)
    return () => clearInterval(interval)
  }, [refreshData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 顶部标题区域 */}
      <TournamentHeader 
        tournament={tournament}
        gameStatus={gameStatus}
        viewerCount={viewerCount}
        onToggleVoting={() => setShowVoting(!showVoting)}
      />

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          
          {/* 左侧：积分榜 */}
          <div className="col-span-3">
            <LeaderboardPanel 
              leaderboard={leaderboard}
              scores={scores}
            />
          </div>

          {/* 中间：游戏内容区域 */}
          <div className="col-span-6 flex flex-col">
            {/* 投票界面 */}
            {showVoting && (
              <div className="mb-4">
                <VotingInterface 
                  votingData={votingData}
                />
              </div>
            )}

            {/* 游戏显示区域 */}
            <div className="flex-1 mb-4">
              <GameDisplay 
                gameStatus={gameStatus}
                tournament={tournament}
              />
            </div>

            {/* 实时事件动态 */}
            <div className="h-64">
              <LiveEventFeed 
                events={events}
                scores={scores}
              />
            </div>
          </div>

          {/* 右侧：弹幕聊天 */}
          <div className="col-span-3">
            <ChatSection 
              isConnected={isConnected}
              viewerCount={viewerCount}
            />
          </div>
        </div>
      </div>

      {/* 连接状态指示器 */}
      <div className="fixed bottom-4 right-4">
        <div className={`px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {isConnected ? '已连接' : '连接断开'}
        </div>
      </div>
    </div>
  )
}