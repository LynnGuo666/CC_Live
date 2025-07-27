'use client'

import { useState } from 'react'
import { Vote, Trophy, Clock, BarChart3 } from 'lucide-react'

interface VoteData {
  game: string
  ticket: number
}

interface VotingInterfaceProps {
  votingData: VoteData[]
  readOnlyMode?: boolean  // 新增只读模式参数
}

const gameDisplayNames: Record<string, string> = {
  '宾果时速': 'Bingo But Fast',
  '跑酷追击': 'Parkour Tag', 
  '斗战方框': 'Battle Box',
  'TNT飞跃': 'TNT Spleef',
  '空岛乱斗': 'Sky Brawl',
  '烫手鳕鱼': 'Hoty Cody Dusky',
  '跑路战士': 'Runaway Warrior'
}

const gameDescriptions: Record<string, string> = {
  '宾果时速': '收集指定物品的竞速游戏',
  '跑酷追击': '追击与逃脱的竞技游戏',
  '斗战方框': '团队战斗与策略游戏',
  'TNT飞跃': '避免掉落的生存游戏',
  '空岛乱斗': '资源收集与战斗游戏',
  '烫手鳕鱼': '传递与生存挑战',
  '跑路战士': '跑酷与技巧挑战'
}

export default function VotingInterface({ votingData, readOnlyMode = false }: VotingInterfaceProps) {
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(false)

  // 计算总票数
  const totalVotes = votingData.reduce((sum, vote) => sum + vote.ticket, 0)

  // 对投票数据进行排序
  const sortedVotingData = [...votingData].sort((a, b) => b.ticket - a.ticket)

  const handleVote = () => {
    if (!selectedGame) return
    
    // 这里应该调用API提交投票
    setHasVoted(true)
    setTimeout(() => {
      setHasVoted(false)
      setSelectedGame('')
    }, 3000) // 3秒后重置状态
  }

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  const getBarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-r from-yellow-400 to-orange-500', // 第一名
      'bg-gradient-to-r from-gray-300 to-gray-400',     // 第二名  
      'bg-gradient-to-r from-amber-600 to-amber-700',   // 第三名
      'bg-gradient-to-r from-blue-400 to-blue-500',     // 其他
      'bg-gradient-to-r from-green-400 to-green-500',
      'bg-gradient-to-r from-purple-400 to-purple-500',
      'bg-gradient-to-r from-pink-400 to-pink-500'
    ]
    return colors[index] || 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Vote className="w-6 h-6 mr-2 text-blue-400" />
          {readOnlyMode ? '投票结果展示' : '游戏投票'}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>总票数: {totalVotes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>投票中</span>
          </div>
        </div>
      </div>

      <div className={`grid ${readOnlyMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* 投票选项 - 只读模式下隐藏 */}
        {!readOnlyMode && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">选择下一个游戏</h3>
            
            {Object.keys(gameDisplayNames).map((game) => (
              <button
                key={game}
                onClick={() => !hasVoted && setSelectedGame(game)}
                disabled={hasVoted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedGame === game
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                } ${hasVoted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{game}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {gameDescriptions[game]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {gameDisplayNames[game]}
                    </div>
                  </div>
                  {selectedGame === game && (
                    <Trophy className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={handleVote}
              disabled={!selectedGame || hasVoted}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                !selectedGame || hasVoted
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasVoted ? '投票成功!' : '投票'}
            </button>
          </div>
        )}

        {/* 投票结果 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">实时投票结果</h3>
          
          {sortedVotingData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Vote className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无投票数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVotingData.map((vote, index) => (
                <div
                  key={vote.game}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {index < 3 && (
                        <Trophy className={`w-4 h-4 ${
                          index === 0 ? 'text-yellow-400' : 
                          index === 1 ? 'text-gray-400' : 'text-amber-600'
                        }`} />
                      )}
                      <span className="font-semibold text-white">{vote.game}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{vote.ticket}</div>
                      <div className="text-sm text-gray-400">{getPercentage(vote.ticket)}%</div>
                    </div>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getBarColor(index)}`}
                      style={{ width: `${getPercentage(vote.ticket)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalVotes > 0 && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-300 text-center">
                实时更新 • 票数最高的游戏将会被选中
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}