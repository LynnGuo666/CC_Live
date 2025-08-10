'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WSMessage, TournamentData } from '@/types/tournament';

export function useWebSocket() {
  const [data, setData] = useState<TournamentData>({
    connectionStatus: { 
      connected: false,
      connection_count: 0,
      last_ping: ''
    },
    currentGameScore: null,
    globalScores: [],
    currentVote: null,
    gameStatus: null,
    recentEvents: [],
    bingoCard: null,
    runawayWarrior: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsClose, setWsClose] = useState<{ code: number; reason: string } | null>(null);

  // WebSocket 地址：优先使用环境变量，其次尝试与页面同源，最后回退到生产地址
  const effectiveUrl =
    (typeof process !== 'undefined' && (process as unknown as { env?: Record<string, unknown> }).env && (process as unknown as { env: Record<string, unknown> }).env.NEXT_PUBLIC_WS_URL)
      ? (process as unknown as { env: Record<string, string> }).env.NEXT_PUBLIC_WS_URL as string
      : (typeof window !== 'undefined' && window.location?.host)
        ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
        : 'wss://live-cc-api.lynn6.top/ws';

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const clientId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      wsRef.current = new WebSocket(`${effectiveUrl}?client_id=${clientId}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsError(null);
        setWsClose(null);
        setData(prev => ({
          ...prev,
          connectionStatus: { 
            ...prev.connectionStatus,
            connected: true
          }
        }));
        setReconnectAttempts(0);

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Request initial status
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'status' }));
        }

        // Auto send viewer_id from cookie if present
        try {
          const match = document.cookie.split('; ').find(row => row.startsWith('viewer_id='));
          if (match) {
            const cookieViewerId = decodeURIComponent(match.split('=')[1] || '');
            if (cookieViewerId && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'viewer_id', viewer_id: cookieViewerId }));
            }
          }
        } catch {}
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'viewer_id_ack':
              setData(prev => ({
                ...prev,
                connectionStatus: {
                  ...prev.connectionStatus,
                  last_ping: message.timestamp,
                  viewer_id: message.viewer_id
                }
              }));
              // Also ensure cookie is present
              try {
                const match = document.cookie.split('; ').find(row => row.startsWith('viewer_id='));
                if (!match && message.viewer_id) {
                  const expires = new Date();
                  expires.setDate(expires.getDate() + 180);
                  document.cookie = `viewer_id=${encodeURIComponent(message.viewer_id)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                }
              } catch {}
              break;
            case 'connection':
              setData(prev => ({
                ...prev,
                connectionStatus: {
                  ...prev.connectionStatus,
                  connected: true
                }
              }));
              break;

            case 'full_data_update':
              // 处理完整数据更新（新的定时广播机制）
              // 注意：服务端的广播不包含 viewer_id。为避免覆盖，合并而非整树替换。
              if (message.data) {
                setData(prev => {
                  const incoming = message.data;
                  const previousConnection = prev.connectionStatus || { connected: false, connection_count: 0, last_ping: '' };
                  const incomingConnection = incoming.connectionStatus || { connected: previousConnection.connected, connection_count: previousConnection.connection_count, last_ping: previousConnection.last_ping };

                  return {
                    ...incoming,
                    connectionStatus: {
                      // 以现有为基，覆盖服务端提供的字段，但保留 viewer_id
                      ...previousConnection,
                      ...incomingConnection,
                      // viewer_id 以已有为主；如之前为空则采用服务端（通常也不会下发）
                      viewer_id: previousConnection.viewer_id ?? incomingConnection.viewer_id,
                      // connected 状态以客户端为准（WS开着即 true）
                      connected: previousConnection.connected || incomingConnection.connected,
                      // last_ping 优先使用服务端的最新值
                      last_ping: incomingConnection.last_ping || previousConnection.last_ping,
                    }
                  };
                });
              }
              break;

            case 'status_response':
              setData(prev => ({
                ...prev,
                connectionStatus: {
                  ...prev.connectionStatus,
                  connection_count: message.connection_count
                }
              }));
              break;

            case 'game_event':
              setData(prev => ({
                ...prev,
                currentGameScore: message.score_prediction,
                recentEvents: [
                  {
                    ...message.data,
                  },
                  ...prev.recentEvents.slice(0, 9)
                ]
              }));
              // 将最近一次分数榜映射到全局，供跑酷弹窗玩家队伍颜色展示
              try {
                const score = message.score_prediction;
                if (score && Array.isArray(score.team_rankings)) {
                  const map: Record<string, { team: string }> = {};
                  for (const t of score.team_rankings) {
                    for (const [p] of Object.entries(t.players || {})) {
                      map[p] = { team: t.team_id };
                    }
                  }
                  (window as unknown as { __lastScoreMap?: Record<string, { team: string }> }).__lastScoreMap = map;
                }
              } catch {}
              break;

            case 'game_score_update':
              setData(prev => ({
                ...prev,
                currentGameScore: prev.currentGameScore ? {
                  ...prev.currentGameScore,
                  total_events_processed: message.data.total_updates
                } : null
              }));
              break;

            case 'global_score_update':
              setData(prev => ({
                ...prev,
                globalScores: message.data.team_scores
              }));
              break;

            case 'global_event':
              setData(prev => ({
                ...prev,
                gameStatus: message.data
              }));
              break;

            case 'vote_event':
              setData(prev => ({
                ...prev,
                currentVote: message.data
              }));
              break;

            case 'pong':
              setData(prev => ({
                ...prev,
                connectionStatus: {
                  ...prev.connectionStatus,
                  last_ping: message.timestamp
                }
              }));
              break;

            default:
              console.log('Unknown message type:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        try {
          setWsError(typeof error === 'string' ? error : (error as unknown as { message?: string }).message || 'WebSocket 发生错误');
        } catch {
          setWsError('WebSocket 发生错误');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setWsClose({ code: event.code, reason: event.reason });
        setData(prev => ({
          ...prev,
          connectionStatus: { 
            ...prev.connectionStatus,
            connected: false 
          }
        }));

        // Clean up intervals
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [effectiveUrl, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setData(prev => ({
      ...prev,
      connectionStatus: { 
        ...prev.connectionStatus,
        connected: false 
      }
    }));
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    isConnected: data.connectionStatus.connected,
    sendMessage,
    connect,
    disconnect,
    wsError,
    wsClose
  };
}
