// Type definitions for the tournament system
export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface Player {
  name: string;
  score: number;
}

export interface TeamRanking {
  team_id: string;
  rank: number;
  total_score: number;
  players: Record<string, number>;
}

export interface ScorePrediction {
  game_id: string;
  round: number;
  timestamp: string;
  team_rankings: TeamRanking[];
  total_events_processed: number;
}

export interface GameEvent {
  player: string;
  team: string;
  event: string;
  lore?: string;
}

export interface GameScore {
  player: string;
  team: string;
  score: number;
}

export interface TeamScore {
  team: string;
  total_score: number;
  player_count: number;
  scores: Array<{
    player: string;
    score: number;
  }>;
}

export interface VoteData {
  time_remaining: number;
  total_games: number;
  total_tickets: number;
  votes: Array<{
    game: string;
    ticket: number;
  }>;
}

export interface GameStatus {
  status: string;
  game?: {
    name: string;
    round: number;
  };
}

// WebSocket message types
export type WSMessage = 
  | { type: 'connection'; status: string; message: string; client_id: string; timestamp: string }
  | { type: 'pong'; timestamp: string }
  | { type: 'status_response'; connection_count: number; client_info: Record<string, unknown> }
  | { type: 'game_event'; game_id: string; data: GameEvent; score_prediction: ScorePrediction; timestamp: string }
  | { type: 'game_score_update'; game_id: string; data: { total_updates: number; scores: GameScore[] }; timestamp: string }
  | { type: 'game_round_change'; game_id: string; round: number; timestamp: string }
  | { type: 'global_score_update'; data: { total_teams: number; team_scores: TeamScore[] }; timestamp: string }
  | { type: 'global_event'; data: GameStatus; timestamp: string }
  | { type: 'vote_event'; data: VoteData; timestamp: string };

export interface ConnectionStatus {
  connected: boolean;
  client_id?: string;
  connection_count?: number;
  last_ping?: string;
}

// Game configuration
export const GAME_NAMES: Record<string, string> = {
  'bingo': '宾果时速',
  'parkour_chase': '跑酷追击',
  'battle_box': '斗战方框',
  'tntrun': 'TNT飞跃',
  'skywars': '空岛乱斗',
  'hot_cod': '烫手鳕鱼',
  'runaway_warrior': '跑路战士',
  'dodging_bolt': '躲避箭'
};

// Game order for tournament progression
export const GAME_ORDER: string[] = [
  'bingo',          // 第1项：宾果时速
  'parkour_chase',  // 第2项：跑酷追击
  'battle_box',     // 第3项：斗战方框
  'tntrun',         // 第4项：TNT飞跃
  'skywars',        // 第5项：空岛乱斗
  'hot_cod',        // 第6项：烫手鳕鱼
  'runaway_warrior', // 第7项：跑路战士
  'dodging_bolt'    // 第8项：躲避箭
];

// Get game number in tournament
export const getGameNumber = (gameId: string): number => {
  const index = GAME_ORDER.indexOf(gameId);
  return index !== -1 ? index + 1 : 0;
};

export const TEAM_COLORS: Record<string, string> = {
  'WHITE': '#FFFFFF',
  'ORANGE': '#FFA500', 
  'MAGENTA': '#FF00FF',
  'LIGHT_BLUE': '#ADD8E6',
  'YELLOW': '#FFFF00',
  'LIME': '#00FF00',
  'PINK': '#FFC0CB',
  'GRAY': '#808080',
  'LIGHT_GRAY': '#D3D3D3',
  'CYAN': '#00FFFF',
  'PURPLE': '#800080',
  'BLUE': '#0000FF',
  'BROWN': '#A52A2A',
  'GREEN': '#008000',
  'RED': '#FF0000',
  'BLACK': '#000000'
};

export const TEAM_NAMES: Record<string, string> = {
  'WHITE': '白队',
  'ORANGE': '橙队',
  'MAGENTA': '品红队', 
  'LIGHT_BLUE': '淡蓝队',
  'YELLOW': '黄队',
  'LIME': '黄绿队',
  'PINK': '粉红队',
  'GRAY': '灰队',
  'LIGHT_GRAY': '淡灰队',
  'CYAN': '青队',
  'PURPLE': '紫队',
  'BLUE': '蓝队',
  'BROWN': '棕队',
  'GREEN': '绿队',
  'RED': '红队',
  'BLACK': '黑队'
};