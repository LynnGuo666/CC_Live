'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WSMessage, ConnectionStatus, ScorePrediction, TeamScore, VoteData, GameStatus, GameEvent } from '@/types/tournament';

export interface TournamentData {
  connectionStatus: ConnectionStatus;
  currentGameScore: ScorePrediction | null;
  globalScores: TeamScore[];
  currentVote: VoteData | null;
  gameStatus: GameStatus | null;
  recentEvents: Array<{
    game_id: string;
    event: GameEvent;
    timestamp: string;
  }>;
  currentRound: Record<string, number>;
}

export function useWebSocket(url: string = 'ws://localhost:8000/ws') {
  const [data, setData] = useState<TournamentData>({
    connectionStatus: { connected: false },
    currentGameScore: null,
    globalScores: [],
    currentVote: null,
    gameStatus: null,
    recentEvents: [],
    currentRound: {}
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const clientId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      wsRef.current = new WebSocket(`${url}?client_id=${clientId}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setData(prev => ({
          ...prev,
          connectionStatus: { connected: true, client_id: clientId }
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
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connection':
              setData(prev => ({
                ...prev,
                connectionStatus: {
                  connected: true,
                  client_id: message.client_id
                }
              }));
              break;

            case 'full_data_update':
              // 处理完整数据更新（新的定时广播机制）
              if (message.data) {
                setData(message.data);
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
              // 兼容旧的游戏事件（如果还有的话）
              setData(prev => ({
                ...prev,
                currentGameScore: message.score_prediction,
                recentEvents: [
                  {
                    game_id: message.game_id,
                    event: message.data,
                    timestamp: message.timestamp,
                    post_time: message.timestamp
                  },
                  ...prev.recentEvents.slice(0, 19) // Keep last 20 events
                ]
              }));
              break;

            case 'game_score_update':
              // Handle game score updates if needed
              break;

            case 'game_round_change':
              setData(prev => ({
                ...prev,
                currentRound: {
                  ...prev.currentRound,
                  [message.game_id]: message.round
                }
              }));
              break;

            case 'global_score_update':
              // 兼容旧的全局分数更新
              if (message.data?.team_scores) {
                setData(prev => ({
                  ...prev,
                  globalScores: message.data.team_scores
                }));
              }
              break;

            case 'global_event':
              // 兼容旧的游戏状态更新
              if (message.data) {
                setData(prev => ({
                  ...prev,
                  gameStatus: message.data
                }));
              }
              break;

            case 'vote_event':
              // 兼容旧的投票事件
              if (message.data) {
                setData(prev => ({
                  ...prev,
                  currentVote: message.data
                }));
              }
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

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setData(prev => ({
          ...prev,
          connectionStatus: { connected: false }
        }));

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, reconnectAttempts]);

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
      wsRef.current.close();
      wsRef.current = null;
    }

    setData(prev => ({
      ...prev,
      connectionStatus: { connected: false }
    }));
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    sendMessage,
    connect,
    disconnect,
    isConnected: data.connectionStatus.connected
  };
}