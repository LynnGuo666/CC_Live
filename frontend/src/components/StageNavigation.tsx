/**
 * 阶段导航组件
 * 显示锦标赛的所有阶段，支持切换查看
 */

'use client'

import React from 'react'
import { TournamentStage } from '@/store/liveStore'
import { Gamepad2, Vote, Coffee, Clock, Play } from 'lucide-react'

interface StageNavigationProps {
  stages: TournamentStage[]
  currentStage: TournamentStage | null
  onStageSelect: (stage: TournamentStage) => void
}

const StageNavigation: React.FC<StageNavigationProps> = ({ 
  stages, 
  currentStage, 
  onStageSelect 
}) => {
  const getStageIcon = (stageType: string) => {
    switch (stageType) {
      case 'game':
        return <Gamepad2 className="w-4 h-4" />
      case 'voting':
        return <Vote className="w-4 h-4" />
      case 'break':
        return <Coffee className="w-4 h-4" />
      default:
        return <Play className="w-4 h-4" />
    }
  }

  const getStageTypeText = (stageType: string) => {
    switch (stageType) {
      case 'game':
        return '游戏'
      case 'voting':
        return '投票'
      case 'break':
        return '休息'
      default:
        return '阶段'
    }
  }

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-500 text-white border-blue-500'
    }
    
    switch (status) {
      case 'in_progress':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
      case 'finished':
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
      default:
        return 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '进行中'
      case 'pending':
        return '等待开始'
      case 'finished':
        return '已结束'
      default:
        return status
    }
  }

  if (stages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          暂无阶段信息
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">比赛阶段</h3>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const isActive = currentStage?.id === stage.id
          const colorClass = getStatusColor(stage.status, isActive)
          
          return (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage)}
              className={`flex-shrink-0 border rounded-lg p-3 transition-colors min-w-32 ${colorClass}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {getStageIcon(stage.stage_type)}
                <span className="text-xs font-medium">
                  第{stage.stage_order}阶段
                </span>
              </div>
              
              <div className="text-sm font-medium mb-1 text-left">
                {stage.title}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {getStageTypeText(stage.stage_type)}
                </span>
                <span>
                  {getStatusText(stage.status)}
                </span>
              </div>
              
              {stage.duration_minutes && (
                <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{stage.duration_minutes}分钟</span>
                </div>
              )}
              
              {stage.game_type && (
                <div className="text-xs text-gray-500 mt-1">
                  {stage.game_type}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {currentStage && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">当前阶段</h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              currentStage.status === 'in_progress' 
                ? 'bg-green-100 text-green-800' 
                : currentStage.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {getStatusText(currentStage.status)}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="font-medium">{currentStage.title}</p>
            {currentStage.description && (
              <p className="mt-1">{currentStage.description}</p>
            )}
          </div>
          
          {currentStage.start_time && (
            <div className="mt-2 text-xs text-gray-500">
              开始时间: {new Date(currentStage.start_time).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StageNavigation