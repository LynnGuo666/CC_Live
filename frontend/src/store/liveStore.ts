/**
 * 应用全局状态管理
 * 使用Zustand管理直播间状态、玩家数据、比赛信息等
 */

import { create } from 'zustand'

// 游戏事件类型定义
export interface GameEvent {
  id: number
  event_type: string
  player?: string
  target?: string
  data?: any
  timestamp: string
}

// 玩家分数数据
export interface PlayerScore {
  player_name: string
  score: number
  level: number
  health: number
  experience: number
  custom_stats?: any
  timestamp: string
}

// 排行榜条目
export interface LeaderboardEntry {
  rank: number
  player_name: string
  total_score: number
  team?: string
  timestamp: string
}

// 比赛状态
export interface MatchStatus {
  match_id: string
  status: string
  current_round: number
  total_rounds: number
  time_remaining?: number
  game_mode?: string
  custom_status?: any
  updated_at: string
}

// 团队统计
export interface TeamStats {
  team_name: string
  total_score: number
  objectives: number
  progress: number
  custom_stats?: any
  timestamp: string
}

// 用户评论
export interface Comment {
  id: number
  username: string
  content: string
  timestamp: string
}

// 比赛信息
export interface Match {
  id: string
  title: string
  description?: string
  game_type?: string
  start_time?: string
  end_time?: string
  status: string
  bilibili_room_id?: string
  bilibili_url?: string
  created_at: string
}

// 锦标赛信息
export interface Tournament {
  id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  status: string
  bilibili_room_id?: string
  bilibili_url?: string
  max_participants?: number
  created_at: string
}

// 锦标赛阶段
export interface TournamentStage {
  id: string
  tournament_id: string
  stage_order: number
  stage_type: string  // game, voting, break
  title: string
  description?: string
  game_type?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  status: string
  config?: any
}

// 投票会话
export interface VotingSession {
  id: string
  tournament_id: string
  stage_id: string
  title: string
  description?: string
  voting_type: string
  start_time?: string
  end_time?: string
  status: string
  allow_public_voting: boolean
  max_votes_per_user: number
  voting_config?: any
}

// 投票选项
export interface VotingOption {
  id: string
  session_id: string
  option_text: string
  description?: string
  option_order: number
  vote_count: number
  percentage?: number
}

// 应用状态接口
interface LiveState {
  // 连接状态
  isConnected: boolean
  currentMatchId: string | null
  currentTournamentId: string | null
  
  // 比赛数据
  match: Match | null
  matchStatus: MatchStatus | null
  
  // 锦标赛数据
  tournament: Tournament | null
  tournamentStages: TournamentStage[]
  currentStage: TournamentStage | null
  
  // 投票数据
  votingSessions: VotingSession[]
  currentVotingSession: VotingSession | null
  votingOptions: VotingOption[]
  
  // 实时数据
  events: GameEvent[]
  playerScores: PlayerScore[]
  leaderboard: LeaderboardEntry[]
  teamStats: TeamStats[]
  comments: Comment[]
  
  // 显示模式
  streamMode: 'text' | 'video'
  
  // Actions
  setConnected: (connected: boolean) => void
  setCurrentMatch: (matchId: string) => void
  setCurrentTournament: (tournamentId: string) => void
  setMatch: (match: Match) => void
  setMatchStatus: (status: MatchStatus) => void
  setTournament: (tournament: Tournament) => void
  setTournamentStages: (stages: TournamentStage[]) => void
  setCurrentStage: (stage: TournamentStage | null) => void
  setVotingSessions: (sessions: VotingSession[]) => void
  setCurrentVotingSession: (session: VotingSession | null) => void
  setVotingOptions: (options: VotingOption[]) => void
  addEvent: (event: GameEvent) => void
  updatePlayerScores: (scores: PlayerScore[]) => void
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void
  updateTeamStats: (stats: TeamStats[]) => void
  addComment: (comment: Comment) => void
  setStreamMode: (mode: 'text' | 'video') => void
  clearData: () => void
}

// 创建全局状态管理
export const useLiveStore = create<LiveState>((set, get) => ({
  // 初始状态
  isConnected: false,
  currentMatchId: null,
  currentTournamentId: null,
  match: null,
  matchStatus: null,
  tournament: null,
  tournamentStages: [],
  currentStage: null,
  votingSessions: [],
  currentVotingSession: null,
  votingOptions: [],
  events: [],
  playerScores: [],
  leaderboard: [],
  teamStats: [],
  comments: [],
  streamMode: 'text',

  // 设置连接状态
  setConnected: (connected: boolean) => 
    set({ isConnected: connected }),

  // 设置当前比赛ID
  setCurrentMatch: (matchId: string) => 
    set({ currentMatchId: matchId }),

  // 设置当前锦标赛ID
  setCurrentTournament: (tournamentId: string) => 
    set({ currentTournamentId: tournamentId }),

  // 设置比赛信息
  setMatch: (match: Match) => 
    set({ match }),

  // 设置比赛状态
  setMatchStatus: (status: MatchStatus) => 
    set({ matchStatus: status }),

  // 设置锦标赛信息
  setTournament: (tournament: Tournament) => 
    set({ tournament }),

  // 设置锦标赛阶段
  setTournamentStages: (stages: TournamentStage[]) => 
    set({ tournamentStages: stages }),

  // 设置当前阶段
  setCurrentStage: (stage: TournamentStage | null) => 
    set({ currentStage: stage }),

  // 设置投票会话
  setVotingSessions: (sessions: VotingSession[]) => 
    set({ votingSessions: sessions }),

  // 设置当前投票会话
  setCurrentVotingSession: (session: VotingSession | null) => 
    set({ currentVotingSession: session }),

  // 设置投票选项
  setVotingOptions: (options: VotingOption[]) => 
    set({ votingOptions: options }),

  // 添加新事件（保持最新100条）
  addEvent: (event: GameEvent) => 
    set((state) => ({
      events: [event, ...state.events].slice(0, 100)
    })),

  // 更新玩家分数
  updatePlayerScores: (scores: PlayerScore[]) => 
    set({ playerScores: scores }),

  // 更新排行榜
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => 
    set({ leaderboard }),

  // 更新团队统计
  updateTeamStats: (stats: TeamStats[]) => 
    set({ teamStats: stats }),

  // 添加评论（保持最新50条）
  addComment: (comment: Comment) => 
    set((state) => ({
      comments: [comment, ...state.comments].slice(0, 50)
    })),

  // 切换直播模式
  setStreamMode: (mode: 'text' | 'video') => 
    set({ streamMode: mode }),

  // 清空所有数据
  clearData: () => 
    set({
      events: [],
      playerScores: [],
      leaderboard: [],
      teamStats: [],
      comments: [],
      matchStatus: null,
      currentStage: null,
      votingSessions: [],
      currentVotingSession: null,
      votingOptions: []
    })
}))