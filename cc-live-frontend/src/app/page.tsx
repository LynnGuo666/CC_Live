'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import Leaderboard from '@/components/Leaderboard';
import GameEventDisplay from '@/components/GameEventDisplay';
import VotingDisplay from '@/components/VotingDisplay';
import ConnectionIndicator from '@/components/ConnectionIndicator';
import GameStatusDisplay from '@/components/GameStatusDisplay';

export default function Home() {
  const { data, isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">S2CC锦标赛 - 实时数据</h1>
              <span className="text-sm text-gray-500">Live Dashboard</span>
            </div>
            <div className="flex-shrink-0">
              <ConnectionIndicator status={data.connectionStatus} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Status and Voting */}
          <div className="lg:col-span-1 space-y-8">
            <GameStatusDisplay 
              gameStatus={data.gameStatus} 
              currentRound={data.currentRound}
            />
            <VotingDisplay voteData={data.currentVote} />
          </div>

          {/* Middle Column - Leaderboards */}
          <div className="lg:col-span-1 space-y-8">
            {/* Current Game Score */}
            {data.currentGameScore && (
              <Leaderboard
                gameScore={data.currentGameScore.team_rankings}
                title={`当前游戏积分榜 (第${data.currentGameScore.round}轮)`}
                showPlayers={true}
              />
            )}

            {/* Global Score */}
            <Leaderboard
              globalScores={data.globalScores}
              title="全局积分榜"
              showPlayers={false}
            />
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-1">
            <GameEventDisplay events={data.recentEvents} maxEvents={15} />
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.connectionStatus.connection_count || 0}
            </div>
            <div className="text-sm text-gray-600">在线观众</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.globalScores.length}
            </div>
            <div className="text-sm text-gray-600">参赛队伍</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.recentEvents.length}
            </div>
            <div className="text-sm text-gray-600">实时事件</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`text-2xl font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '在线' : '离线'}
            </div>
            <div className="text-sm text-gray-600">连接状态</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <div className="mb-2">S2CC锦标赛实时数据看板</div>
            <div>WebSocket连接状态: {isConnected ? '🟢 已连接' : '🔴 未连接'}</div>
            {data.connectionStatus.client_id && (
              <div className="mt-1">客户端ID: {data.connectionStatus.client_id}</div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
