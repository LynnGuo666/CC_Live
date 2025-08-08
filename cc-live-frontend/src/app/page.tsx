'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import GameEventDisplay from '@/components/GameEventDisplay';
import VotingDisplay from '@/components/VotingDisplay';
import ConnectionIndicator from '@/components/ConnectionIndicator';
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
      const numberMap: { [key: number]: string } = {
        1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十'
      };
      const chineseNumber = numberMap[gameNumber] || gameNumber.toString();
      return gameNumber > 0 ? `${gameName}｜第${chineseNumber}项` : `${gameName}`;
    }
    return null;
  };

  // Get status display info
  const getStatusInfo = () => {
    const status = data.gameStatus?.status || 'waiting';
    const statusConfig: { [key: string]: { color: string; text: string } } = {
      'gaming': { color: 'bg-green-500', text: '游戏中' },
      'waiting': { color: 'bg-blue-500', text: '等待中' },
      'voting': { color: 'bg-purple-500', text: '投票中' },
      'halfing': { color: 'bg-blue-500', text: '休息中' },
      'setting': { color: 'bg-orange-500', text: '设置中' },
      'finished': { color: 'bg-gray-500', text: '已结束' }
    };
    return statusConfig[status] || { color: 'bg-gray-500', text: status };
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-16 w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">S2CC 锦标赛</h1>
            </div>
            
            {/* Center - Game Info and Round */}
            <div className="flex items-center space-x-6">
              {getCurrentGameInfo() && (
                <span className="text-lg font-medium text-blue-600">{getCurrentGameInfo()}</span>
              )}
              {data.gameStatus?.game && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <span>🎮</span>
                  <span>第 {data.gameStatus.game.round} 轮</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {/* Game Status Indicator */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusInfo().color}`}></div>
                  <span>{getStatusInfo().text}</span>
                </div>
                
                {/* Voting Time */}
                {data.gameStatus?.status === 'voting' && data.currentVote?.time_remaining && (
                  <div className="flex items-center space-x-1">
                    <span>⏱️</span>
                    <span>剩余: {formatTime(data.currentVote.time_remaining)}</span>
                  </div>
                )}
                
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)] max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-full">
          {/* Left Column - Global Leaderboard */}
          <div className="xl:col-span-3 flex flex-col min-h-[600px]">
            <GlobalLeaderboard 
              globalScores={data.globalScores}
              className="flex-1 min-h-0"
            />
          </div>

          {/* Center Column - Game Display */}
          <div className="xl:col-span-6 min-h-[600px] flex flex-col space-y-6">
            {/* Game Display */}
            {/* 将 runawayWarrior 汇总通过 context 下发到 RunawayWarriorDisplay */}
            <GameDisplay 
              gameStatus={data.gameStatus}
              currentGameScore={data.currentGameScore}
              voteData={data.currentVote}
              bingoCard={data.bingoCard}
              runawayWarrior={data.runawayWarrior}
              className="flex-1 min-h-0"
            />
            
            {/* Events */}
            <GameEventDisplay 
              events={data.recentEvents} 
              maxEvents={8}
              className="h-48"
            />
          </div>

          {/* Right Column - Current Game Leaderboard */}
          <div className="xl:col-span-3 flex flex-col min-h-[600px]">
            <CurrentGameLeaderboard 
              currentGameScore={data.currentGameScore}
              gameStatus={data.gameStatus}
              className="flex-1 min-h-0"
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

// Helper function for formatting time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
