'use client'

import { Trophy, Users, Clock, Gamepad2 } from 'lucide-react'

interface GameStatus {
  status: string
  game: {
    name: string
    round: number
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
  onToggleVoting: () => void
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
  viewerCount, 
  onToggleVoting 
}: TournamentHeaderProps) {
  const currentStatus = gameStatus?.status || tournament?.status || 'setting'
  const currentGame = gameStatus?.game?.name || tournament?.current_game || '待定'
  const currentRound = gameStatus?.game?.round || tournament?.current_round || 1

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="container mx-auto">
        {/* 主标题行 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                {tournament?.name || 'Minecraft锦标赛'}
              </h1>
              <p className="text-gray-400 text-sm">
                实时直播 · 第{currentRound}轮
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* 在线观看人数 */}
            <div className="flex items-center space-x-2 text-gray-300">
              <Users className="w-5 h-5" />
              <span className="text-lg font-semibold">{viewerCount}</span>
              <span className="text-sm">在线观看</span>
            </div>

            {/* 投票按钮 */}
            <button
              onClick={onToggleVoting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              游戏投票
            </button>
          </div>
        </div>

        {/* 游戏状态行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* 当前游戏 */}
            <div className="flex items-center space-x-3">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-gray-400 text-sm">当前游戏</span>
                <div className="text-white font-semibold">{currentGame}</div>
              </div>
            </div>

            {/* 游戏状态 */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${statusColors[currentStatus as keyof typeof statusColors]} ${
                currentStatus === 'gaming' ? 'game-status-gaming' : ''
              }`} />
              <div>
                <span className="text-gray-400 text-sm">状态</span>
                <div className="text-white font-semibold">
                  {statusText[currentStatus as keyof typeof statusText]}
                </div>
              </div>
            </div>

            {/* 预估剩余时间 */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-400" />
              <div>
                <span className="text-gray-400 text-sm">预估剩余时间</span>
                <div className="text-white font-semibold">15:30</div>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="flex-1 max-w-md mx-8">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>锦标赛进度</span>
              <span>65%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: '65%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}