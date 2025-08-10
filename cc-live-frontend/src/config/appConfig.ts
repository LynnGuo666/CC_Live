export type TournamentStatus = 'gaming' | 'waiting' | 'voting' | 'halfing' | 'setting' | 'finished';

export interface AppConfig {
  /** 是否在页面加载时自动连接 WebSocket */
  autoConnectWebSocket: boolean;
  /** 覆盖展示的赛事状态（仅前端展示，不影响后端数据） */
  statusOverride?: TournamentStatus;
}

// 允许通过环境变量覆盖，便于部署时调整
const envAuto = typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_AUTO_CONNECT_WS;
const rawStatus = typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_STATUS_OVERRIDE;
const envStatus = (rawStatus && ['gaming','waiting','voting','halfing','setting','finished'].includes(rawStatus)) ? (rawStatus as TournamentStatus) : undefined;

export const appConfig: AppConfig = {
  autoConnectWebSocket: envAuto ? envAuto === 'true' : true,
  // 按你的需求，前端展示状态默认设为已结束；可通过 NEXT_PUBLIC_STATUS_OVERRIDE 调整
  statusOverride: envStatus ?? 'finished'
};

export const APP_CONFIG = {
  // 版本号：从单独配置文件读入，便于集中管理与自动更新
  version: 'v20250810 1802',
  // 博客地址
  blogUrl: 'https://blog.lynn6.cn',
  // 官方站点：联合锦标赛官网
  officialSiteUrl: 'https://cc.ziip.space',
  // 反作弊系统介绍
  antiCheatUrl: 'https://racesafe-cc.lynn6.top',
  // GitHub 链接
  githubProfileUrl: 'https://github.com/LynnGuo666',
  githubRepoUrl: 'https://github.com/LynnGuo666/CC_Live',
};


