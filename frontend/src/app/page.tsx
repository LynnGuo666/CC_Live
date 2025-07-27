/**
 * 比赛列表页面
 * 显示所有可观看的锦标赛和比赛，支持搜索和筛选
 */

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Match, Tournament } from '@/store/liveStore'
import { 
  Gamepad2, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trophy,
  Layers
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TournamentCardProps {
  tournament: Tournament
}

interface MatchCardProps {
  match: Match
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 border-l-4 border-l-orange-500">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {tournament.title}
              </h3>
            </div>
            {tournament.description && (
              <p className="text-sm text-gray-600 mb-3">
                {tournament.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(tournament.status)}`}>
              {getStatusText(tournament.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>多阶段锦标赛</span>
          </div>
          
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
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            锦标赛ID: {tournament.id}
          </div>
          
          <Link href={`/tournament/${tournament.id}`}>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>观看锦标赛</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {match.title}
            </h3>
            {match.description && (
              <p className="text-sm text-gray-600 mb-3">
                {match.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(match.status)}`}>
              {getStatusText(match.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="w-4 h-4" />
            <span>{match.game_type || '小游戏'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>
              {match.created_at && formatDistanceToNow(new Date(match.created_at), { 
                addSuffix: true, 
                locale: zhCN 
              })}
            </span>
          </div>
          
          {match.start_time && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(match.start_time).toLocaleString('zh-CN')}
              </span>
            </div>
          )}
          
          {match.bilibili_url && (
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>支持视频直播</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            ID: {match.id}
          </div>
          
          <Link href={`/live/${match.id}`}>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>观看直播</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'tournaments' | 'matches'>('all')

  // 获取锦标赛和比赛列表
  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [tournamentsResponse, matchesResponse] = await Promise.all([
        fetch('/api/tournament/tournaments'),
        fetch('/api/matches/')
      ])
      
      if (tournamentsResponse.ok) {
        const tournamentsData = await tournamentsResponse.json()
        setTournaments(tournamentsData)
        setFilteredTournaments(tournamentsData)
      }
      
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData)
        setFilteredMatches(matchesData)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 搜索和筛选
  useEffect(() => {
    let filteredTourns = tournaments
    let filteredMatches = matches

    // 状态筛选
    if (statusFilter !== 'all') {
      filteredTourns = filteredTourns.filter(tournament => tournament.status === statusFilter)
      filteredMatches = filteredMatches.filter(match => match.status === statusFilter)
    }

    // 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      
      filteredTourns = filteredTourns.filter(tournament => 
        tournament.title.toLowerCase().includes(term) ||
        tournament.description?.toLowerCase().includes(term) ||
        tournament.id.toLowerCase().includes(term)
      )
      
      filteredMatches = filteredMatches.filter(match => 
        match.title.toLowerCase().includes(term) ||
        match.description?.toLowerCase().includes(term) ||
        match.game_type?.toLowerCase().includes(term) ||
        match.id.toLowerCase().includes(term)
      )
    }

    setFilteredTournaments(filteredTourns)
    setFilteredMatches(filteredMatches)
  }, [tournaments, matches, searchTerm, statusFilter])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载数据中...</p>
        </div>
      )
    }

    const showTournaments = viewMode === 'all' || viewMode === 'tournaments'
    const showMatches = viewMode === 'all' || viewMode === 'matches'
    const hasContent = (showTournaments && filteredTournaments.length > 0) || (showMatches && filteredMatches.length > 0)

    if (!hasContent) {
      return (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? '未找到匹配的内容' : '暂无比赛'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? '尝试调整搜索条件或筛选器'
              : '等待比赛开始或创建新比赛'
            }
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {/* 锦标赛区域 */}
        {showTournaments && filteredTournaments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-orange-500" />
              <span>锦标赛 ({filteredTournaments.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        {/* 独立比赛区域 */}
        {showMatches && filteredMatches.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Gamepad2 className="w-6 h-6 text-blue-500" />
              <span>独立比赛 ({filteredMatches.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                MC小游戏比赛直播
              </h1>
              <p className="text-gray-600 mt-1">
                观看实时锦标赛和比赛直播
              </p>
            </div>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* 第一行：搜索和状态筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索锦标赛、比赛标题、描述或ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">等待开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="finished">已结束</option>
                </select>
              </div>
            </div>

            {/* 第二行：视图模式切换 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setViewMode('tournaments')}
                className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center space-x-1 ${
                  viewMode === 'tournaments' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Trophy className="w-3 h-3" />
                <span>锦标赛</span>
              </button>
              <button
                onClick={() => setViewMode('matches')}
                className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center space-x-1 ${
                  viewMode === 'matches' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Gamepad2 className="w-3 h-3" />
                <span>独立比赛</span>
              </button>
            </div>
            
            {/* 统计信息 */}
            <div className="text-sm text-gray-600">
              {searchTerm || statusFilter !== 'all' ? (
                <span>
                  找到 {filteredTournaments.length} 个锦标赛，{filteredMatches.length} 场独立比赛
                </span>
              ) : (
                <span>
                  共 {tournaments.length} 个锦标赛，{matches.length} 场独立比赛
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        {renderContent()}
      </div>
    </div>
  )
}