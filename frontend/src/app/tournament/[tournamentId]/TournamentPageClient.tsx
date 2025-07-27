/**
 * 锦标赛观看页面客户端组件
 * 支持多阶段比赛和投票环节的观看
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveStore, Tournament, TournamentStage, VotingSession } from '@/store/liveStore'
import TournamentStageView from '@/components/TournamentStageView'
import VotingInterface from '@/components/VotingInterface'
import TournamentHeader from '@/components/TournamentHeader'
import StageNavigation from '@/components/StageNavigation'
import { ChatSection } from '@/components/ChatSection'

export default function TournamentPageClient() {
  const params = useParams()
  const tournamentId = params.tournamentId as string
  
  const {
    tournament,
    tournamentStages,
    currentStage,
    currentVotingSession,
    comments,
    isConnected,
    setTournament,
    setTournamentStages,
    setCurrentStage,
    setCurrentTournament,
    setConnected,
    clearData
  } = useLiveStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取锦标赛信息
  const fetchTournamentData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取锦标赛基本信息
      const tournamentResponse = await fetch(`/api/tournament/tournaments/${tournamentId}`)
      if (!tournamentResponse.ok) {
        throw new Error('锦标赛不存在')
      }
      const tournamentData: Tournament = await tournamentResponse.json()
      setTournament(tournamentData)

      // 获取锦标赛阶段
      const stagesResponse = await fetch(`/api/tournament/tournaments/${tournamentId}/stages`)
      if (stagesResponse.ok) {
        const stagesData: TournamentStage[] = await stagesResponse.json()
        setTournamentStages(stagesData)
        
        // 设置当前正在进行的阶段
        const activeStage = stagesData.find(stage => stage.status === 'in_progress')
        if (activeStage) {
          setCurrentStage(activeStage)
        } else {
          // 如果没有正在进行的阶段，选择第一个待开始的阶段
          const nextStage = stagesData.find(stage => stage.status === 'pending')
          setCurrentStage(nextStage || stagesData[0] || null)
        }
      }

    } catch (error) {
      console.error('获取锦标赛数据失败:', error)
      setError(error instanceof Error ? error.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tournamentId) return

    setCurrentTournament(tournamentId)
    fetchTournamentData()

    // 简单的连接状态模拟
    setConnected(true)

    return () => {
      clearData()
    }
  }, [tournamentId])

  // 处理阶段切换
  const handleStageSelect = (stage: TournamentStage) => {
    setCurrentStage(stage)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载锦标赛数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTournamentData}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">锦标赛不存在</h3>
          <p className="text-gray-600">请检查锦标赛ID是否正确</p>
        </div>
      </div>
    )
  }

  const renderStageContent = () => {
    if (!currentStage) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活动阶段</h3>
            <p className="text-gray-600">锦标赛尚未开始或已结束</p>
          </div>
        </div>
      )
    }

    switch (currentStage.stage_type) {
      case 'voting':
        return currentVotingSession ? (
          <VotingInterface session={currentVotingSession} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">投票环节</h3>
              <p className="text-gray-600">投票尚未开始</p>
            </div>
          </div>
        )
      
      case 'game':
        return <TournamentStageView stage={currentStage} />
      
      case 'break':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">休息时间</h3>
              <p className="text-gray-600">{currentStage.description || '中场休息，请稍等'}</p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{currentStage.title}</h3>
              <p className="text-gray-600">{currentStage.description || '准备中...'}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 锦标赛头部信息 */}
      <TournamentHeader tournament={tournament} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主要内容区域 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 阶段导航 */}
            <StageNavigation 
              stages={tournamentStages}
              currentStage={currentStage}
              onStageSelect={handleStageSelect}
            />
            
            {/* 阶段内容 */}
            {renderStageContent()}
          </div>
          
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <ChatSection 
              comments={comments} 
              isConnected={isConnected}
              className="h-96"
            />
          </div>
        </div>
      </div>
    </div>
  )
}