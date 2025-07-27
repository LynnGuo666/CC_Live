'use client'

import { Monitor, Gamepad2, Clock, Users } from 'lucide-react'

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

interface GameDisplayProps {
  gameStatus: GameStatus | null
  tournament: Tournament | null
}

const gameDescriptions: Record<string, string> = {
  '宾果时速': '在有限的时间里，尽可能多和快地收集宾果所要求的物品',
  '跑酷追击': '在跑酷的竞技场中，抓住所有对手，或者尽可能在对手的追击下存活更长时间',
  '斗战方框': '在有限的空间内与对手决斗，击杀对手并通过填满场地中央的羊毛方框来取得胜利',
  'TNT飞跃': '踩中的方块会消失！尽量比其他玩家活得更久',
  '空岛乱斗': '在天空中收集资源、搭建桥梁，并在不断缩小的活动空域内尽可能长时间地存活并击杀对手',
  '烫手鳕鱼': '新鲜出炉的烫手鳕鱼！在被烫到受不了之前将鳕鱼扔给其他人',
  '跑路战士': 'SCC跑酷激情回归，等等......跑路？闯过一系列跑酷关卡，尝试抵达终点',
  '躲避箭': '最终对决：躲闪对手的射击，通过命中淘汰对手'
}

const gameImages: Record<string, string> = {
  '宾果时速': '/api/placeholder/400/300',
  '跑酷追击': '/api/placeholder/400/300', 
  '斗战方框': '/api/placeholder/400/300',
  'TNT飞跃': '/api/placeholder/400/300',
  '空岛乱斗': '/api/placeholder/400/300',
  '烫手鳕鱼': '/api/placeholder/400/300',
  '跑路战士': '/api/placeholder/400/300',
  '躲避箭': '/api/placeholder/400/300'
}

const statusColors = {
  gaming: 'text-green-400',
  voting: 'text-blue-400', 
  halfing: 'text-yellow-400',
  setting: 'text-gray-400'
}

const statusText = {
  gaming: '游戏进行中',
  voting: '投票选择中',
  halfing: '中场休息',
  setting: '游戏设置中'
}

export default function GameDisplay({ gameStatus, tournament }: GameDisplayProps) {
  const currentGame = gameStatus?.game?.name || tournament?.current_game || '等待开始'
  const currentRound = gameStatus?.game?.round || tournament?.current_round || 1
  const currentStatus = gameStatus?.status || tournament?.status || 'setting'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
      {/* 游戏标题栏 */}
      <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentGame}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">第 {currentRound} 轮</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${statusColors[currentStatus as keyof typeof statusColors]}`}>
              <div className={`w-3 h-3 rounded-full bg-current ${
                currentStatus === 'gaming' ? 'animate-pulse' : ''
              }`} />
              <span className="font-semibold">
                {statusText[currentStatus as keyof typeof statusText]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 游戏内容区域 */}
      <div className="flex-1 p-6">
        {currentGame === '等待开始' ? (
          // 等待状态
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">等待游戏开始</h3>
              <p className="text-gray-400">锦标赛即将开始，请耐心等待...</p>
            </div>
          </div>
        ) : (
          // 游戏进行中
          <div className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* 游戏预览图 */}
              <div className="relative">
                <div className="bg-gray-700 rounded-lg h-full min-h-64 flex items-center justify-center">
                  {/* 这里可以放置游戏截图或者游戏场地图片 */}
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">游戏直播画面</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {currentGame} - 第{currentRound}轮
                    </p>
                  </div>
                </div>
                
                {/* 状态叠加层 */}
                {currentStatus === 'gaming' && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 游戏信息 */}
              <div className="space-y-6">
                {/* 游戏描述 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Gamepad2 className="w-5 h-5 mr-2 text-blue-400" />
                    游戏介绍
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {gameDescriptions[currentGame] || '精彩的Minecraft竞技游戏'}
                  </p>
                </div>

                {/* 游戏统计 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-400" />
                    游戏信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">#{currentRound}</div>
                      <div className="text-sm text-gray-400">当前轮次</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">12</div>
                      <div className="text-sm text-gray-400">参赛队伍</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">48</div>
                      <div className="text-sm text-gray-400">参赛玩家</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">15:30</div>
                      <div className="text-sm text-gray-400">预估时长</div>
                    </div>
                  </div>
                </div>

                {/* 实时信息 */}
                {currentStatus === 'gaming' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-400" />
                      实时信息
                    </h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">游戏状态</span>
                          <span className="text-green-400 font-semibold">进行中</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">当前轮次</span>
                          <span className="text-white">第 {currentRound} 轮</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">游戏模式</span>
                          <span className="text-white">{currentGame}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}