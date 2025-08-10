export type TournamentStatus = 'gaming' | 'waiting' | 'voting' | 'halfing' | 'setting' | 'finished';

export interface AppConfig {
  /** 是否在页面加载时自动连接 WebSocket */
  autoConnectWebSocket: boolean;
  /** 覆盖展示的赛事状态（仅前端展示，不影响后端数据） */
  statusOverride?: TournamentStatus;
  developerName: string;
  blogUrl: string;
  githubUrl: string;
  repoUrl: string;
  buildVersion: string;
  dataPageUrl: string;
  antiCheatUrl: string;
}

// 允许通过环境变量覆盖，便于部署时调整
const envAuto = typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_AUTO_CONNECT_WS;
const rawStatus = typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_STATUS_OVERRIDE;
const envStatus = (rawStatus && ['gaming','waiting','voting','halfing','setting','finished'].includes(rawStatus)) ? (rawStatus as TournamentStatus) : undefined;

export const appConfig: AppConfig = {
  autoConnectWebSocket: envAuto ? envAuto === 'true' : true,
  // 按你的需求，前端展示状态默认设为已结束；可通过 NEXT_PUBLIC_STATUS_OVERRIDE 调整
  statusOverride: envStatus ?? 'finished',
  developerName: 'Venti_Lynn',
  blogUrl: 'https://blog.lynn6.cn',
  githubUrl: 'https://github.com/LynnGuo666',
  repoUrl: 'https://github.com/LynnGuo666/CC_Live',
  buildVersion: 'v20250810 1802',
  dataPageUrl: 'https://cc.ziip.space',
  antiCheatUrl: 'https://racesafe-cc.lynn6.top'
};

// 兼容旧引用
export const APP_CONFIG = {
  version: appConfig.buildVersion,
  blogUrl: appConfig.blogUrl,
  officialSiteUrl: appConfig.dataPageUrl,
  antiCheatUrl: appConfig.antiCheatUrl,
  githubProfileUrl: appConfig.githubUrl,
  githubRepoUrl: appConfig.repoUrl,
};


