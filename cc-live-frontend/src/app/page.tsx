'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import GameEventDisplay from '@/components/GameEventDisplay';
import VotingDisplay from '@/components/VotingDisplay';
import ConnectionIndicator from '@/components/ConnectionIndicator';
import GameStatusDisplay from '@/components/GameStatusDisplay';
import GameDisplay from '@/components/GameDisplay';
import CurrentGameLeaderboard from '@/components/CurrentGameLeaderboard';
import { GAME_NAMES } from '@/types/tournament';

export default function Home() {
  const { data, isConnected } = useWebSocket();

  // Get current game name for header
  const getCurrentGameInfo = () => {
    if (data.gameStatus?.game) {
      const gameName = GAME_NAMES[data.gameStatus.game.name] || data.gameStatus.game.name;
      // 使用后端提供的tournament_number，如果没有或为0则不显示项目编号
      const gameNumber = data.gameStatus.game.tournament_number || 0;
      return gameNumber > 0 ? `第${gameNumber}项：${gameName}` : `${gameName}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">S2CC 锦标赛</h1>
              {getCurrentGameInfo() && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-lg font-medium text-blue-600">{getCurrentGameInfo()}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>👥</span>
                  <span>{data.connectionStatus.connection_count || 0} 人在线</span>
                </div>
                {data.connectionStatus.last_ping && (
                  <div className="flex items-center space-x-1">
                    <span>📡</span>
                    <span>心跳: {formatLastPing(data.connectionStatus.last_ping)}</span>
                  </div>
                )}
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                  {isConnected ? '已连接' : '未连接'}
                </span>
                {data.connectionStatus.client_id && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ID: {data.connectionStatus.client_id.slice(-8)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Column - Global Leaderboard */}
          <div className="xl:col-span-3 flex flex-col">
            <GlobalLeaderboard 
              globalScores={data.globalScores}
              className="flex-1"
            />
          </div>

          {/* Center Column - Game Status and Display */}
          <div className="xl:col-span-6 flex flex-col space-y-6">
            {/* Game Status */}
            <GameStatusDisplay 
              gameStatus={data.gameStatus} 
              currentRound={data.currentRound}
              voteData={data.currentVote}
            />
            
            {/* Game Display */}
            <GameDisplay 
              gameStatus={data.gameStatus}
              currentGameScore={data.currentGameScore}
              className="flex-1"
            />
            
            {/* Events */}
            <GameEventDisplay 
              events={data.recentEvents} 
              maxEvents={8}
              className="h-48"
            />
          </div>

          {/* Right Column - Current Game Leaderboard */}
          <div className="xl:col-span-3 flex flex-col">
            <CurrentGameLeaderboard 
              currentGameScore={data.currentGameScore}
              gameStatus={data.gameStatus}
              className="flex-1"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function for formatting ping time
function formatLastPing(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}秒前`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}分钟前`;
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}
