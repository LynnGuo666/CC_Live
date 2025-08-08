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

  // 写死后端 WS 地址（按要求：live-cc-api.lynn6.top）
  const effectiveUrl = 'wss://live-cc-api.lynn6.top/ws';

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const clientId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      wsRef.current = new WebSocket(`${effectiveUrl}?client_id=${clientId}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
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
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
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
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
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
    disconnect
  };
}
