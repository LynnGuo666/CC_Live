'use client'

import { Trophy, Users, Clock, Gamepad2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface GameStatus {
  status: string
  game: {
    name: string
    round: number
    game_index?: number
    total_games?: number
  }
}

interface Tournament {
  id: number
  name: string
  status: string
  current_game?: string
  current_round: number
}

interface TournamentHeaderProps {
  tournament: Tournament | null
  gameStatus: GameStatus | null
  viewerCount: number
}

const statusColors = {
  gaming: 'bg-green-500',
  voting: 'bg-blue-500',
  halfing: 'bg-yellow-500',
  setting: 'bg-gray-500'
}

const statusText = {
  gaming: '游戏中',
  voting: '投票中',
  halfing: '中场休息',
  setting: '设置中'
}

export default function TournamentHeader({ 
  tournament, 
  gameStatus, 
  viewerCount
}: TournamentHeaderProps) {
  const currentStatus = gameStatus?.status || tournament?.status || 'setting'
  const currentGame = gameStatus?.game?.name || tournament?.current_game || '待定'
  const currentRound = gameStatus?.game?.round || tournament?.current_round || 1
  const gameIndex = gameStatus?.game?.game_index || 1
  const totalGames = gameStatus?.game?.total_games || 1
  const roundProgress = totalGames > 1 ? `${gameIndex}/${totalGames}` : ''

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4">
      <div className="container mx-auto">
        {/* 主标题行 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Trophy className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tournament?.name || 'Minecraft锦标赛'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                实时直播 · 第{currentRound}轮{roundProgress && ` (${roundProgress})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* 当前游戏 */}
            <div className="flex items-center space-x-3">
              <Gamepad2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">当前游戏</span>
                <div className="text-gray-900 dark:text-white font-semibold">{currentGame}</div>
              </div>
            </div>

            {/* 游戏状态 */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${statusColors[currentStatus as keyof typeof statusColors]} ${
                currentStatus === 'gaming' ? 'game-status-gaming' : ''
              }`} />
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">状态</span>
                <div className="text-gray-900 dark:text-white font-semibold">
                  {statusText[currentStatus as keyof typeof statusText]}
                </div>
              </div>
            </div>

            {/* 在线观看人数 */}
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Users className="w-5 h-5" />
              <span className="text-lg font-semibold">{viewerCount}</span>
              <span className="text-sm">在线观看</span>
            </div>

            {/* 主题切换按钮 */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}