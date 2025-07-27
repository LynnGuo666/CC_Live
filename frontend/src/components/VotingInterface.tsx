/**
 * 投票界面组件
 * 支持实时投票和结果展示
 */

'use client'

import React, { useState, useEffect } from 'react'
import { VotingSession, VotingOption, useLiveStore } from '@/store/liveStore'
import { Vote, BarChart3, Users, Clock, CheckCircle } from 'lucide-react'

interface VotingInterfaceProps {
  session: VotingSession
}

const VotingInterface: React.FC<VotingInterfaceProps> = ({ session }) => {
  const { votingOptions, setVotingOptions } = useLiveStore()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votingResults, setVotingResults] = useState<VotingOption[]>([])
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  // 获取投票选项和结果
  useEffect(() => {
    fetchVotingData()
  }, [session.id])

  const fetchVotingData = async () => {
    try {
      // 获取投票结果
      const resultsResponse = await fetch(`/api/tournament/voting-sessions/${session.id}/results`)
      if (resultsResponse.ok) {
        const results = await resultsResponse.json()
        setVotingResults(results.options)
        setVotingOptions(results.options)
      }
    } catch (error) {
      console.error('获取投票数据失败:', error)
    }
  }

  // 提交投票
  const handleVote = async () => {
    if (!selectedOption || !userName.trim() || hasVoted) return

    setLoading(true)
    try {
      const response = await fetch('/api/tournament/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id,
          option_id: selectedOption,
          voter_id: userName.trim(),
          voter_type: 'user'
        })
      })

      if (response.ok) {
        setHasVoted(true)
        // 刷新投票结果
        await fetchVotingData()
      } else {
        const error = await response.json()
        alert(error.detail || '投票失败')
      }
    } catch (error) {
      console.error('投票失败:', error)
      alert('投票失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const getVotingTypeText = (type: string) => {
    switch (type) {
      case 'single_choice':
        return '单选投票'
      case 'multiple_choice':
        return '多选投票'
      case 'ranking':
        return '排序投票'
      default:
        return '投票'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'finished':
        return 'bg-gray-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '投票中'
      case 'pending':
        return '等待开始'
      case 'finished':
        return '已结束'
      default:
        return status
    }
  }

  const totalVotes = votingResults.reduce((sum, option) => sum + option.vote_count, 0)
  const canVote = session.status === 'active' && !hasVoted && session.allow_public_voting

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 投票头部 */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Vote className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">{session.title}</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(session.status)}`}>
              {getStatusText(session.status)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{totalVotes} 票</span>
            </div>
            
            {session.end_time && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>截止: {new Date(session.end_time).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
        </div>
        
        {session.description && (
          <p className="text-gray-600 mb-4">{session.description}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{getVotingTypeText(session.voting_type)}</span>
          <span>每人最多 {session.max_votes_per_user} 票</span>
          {!session.allow_public_voting && (
            <span className="text-red-500">仅限参赛者投票</span>
          )}
        </div>
      </div>

      {/* 投票区域 */}
      <div className="p-6">
        {canVote ? (
          <div className="space-y-6">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                您的名称
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="请输入您的名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 投票选项 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                请选择您的选项
              </label>
              <div className="space-y-3">
                {votingResults.map((option) => (
                  <div
                    key={option.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedOption === option.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === option.id
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedOption === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{option.option_text}</h4>
                        {option.description && (
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {option.vote_count} 票
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 投票按钮 */}
            <button
              onClick={handleVote}
              disabled={!selectedOption || !userName.trim() || loading}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-md hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>提交中...</span>
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4" />
                  <span>提交投票</span>
                </>
              )}
            </button>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">投票成功</h3>
            <p className="text-gray-600">感谢您的参与，投票结果将实时更新</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Vote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {session.status === 'finished' ? '投票已结束' : 
               session.status === 'pending' ? '投票尚未开始' : 
               !session.allow_public_voting ? '仅限参赛者投票' : '无法投票'}
            </h3>
          </div>
        )}

        {/* 投票结果图表 */}
        {votingResults.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">实时结果</h3>
              <span className="text-sm text-gray-500">({totalVotes} 总票数)</span>
            </div>
            
            <div className="space-y-3">
              {votingResults.map((option, index) => {
                const percentage = totalVotes > 0 ? (option.vote_count / totalVotes * 100) : 0
                
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{option.option_text}</span>
                      <span className="text-gray-600">
                        {option.vote_count} 票 ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VotingInterface