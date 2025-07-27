/**
 * 锦标赛头部信息组件
 * 显示锦标赛基本信息和状态
 */

'use client'

import React from 'react'
import { Tournament } from '@/store/liveStore'
import { Trophy, Calendar, Users, Clock, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TournamentHeaderProps {
  tournament: Tournament
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournament }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
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

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h1 className="text-3xl font-bold">{tournament.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
            </div>
            
            {tournament.description && (
              <p className="text-orange-100 text-lg mb-4 max-w-3xl">
                {tournament.description}
              </p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {tournament.created_at && formatDistanceToNow(new Date(tournament.created_at), { 
                    addSuffix: true, 
                    locale: zhCN 
                  })}
                </span>
              </div>
              
              {tournament.start_time && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(tournament.start_time).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
              
              {tournament.max_participants && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>最多{tournament.max_participants}人</span>
                </div>
              )}
              
              {tournament.bilibili_url && (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <a 
                    href={tournament.bilibili_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-200 transition-colors"
                  >
                    B站直播间
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-orange-200">
          锦标赛ID: {tournament.id}
        </div>
      </div>
    </div>
  )
}

export default TournamentHeader