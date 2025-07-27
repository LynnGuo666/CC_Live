/**
 * 聊天评论组件
 * 支持用户发送评论和显示实时聊天消息
 */

import React, { useState, useRef, useEffect } from 'react'
import { Comment } from '@/store/liveStore'
import { MessageCircle, Send, User } from 'lucide-react'
import { wsManager } from '@/utils/websocket'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface CommentItemProps {
  comment: Comment
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className="chat-message other">
      <div className="flex items-center space-x-2 mb-1">
        <User className="w-3 h-3 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">
          {comment.username}
        </span>
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(comment.timestamp), { 
            addSuffix: true, 
            locale: zhCN 
          })}
        </span>
      </div>
      <p className="text-sm text-gray-800">{comment.content}</p>
    </div>
  )
}

interface ChatSectionProps {
  comments: Comment[]
  isConnected: boolean
  className?: string
}

export const ChatSection: React.FC<ChatSectionProps> = ({ 
  comments, 
  isConnected, 
  className = '' 
}) => {
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isUsernameSet, setIsUsernameSet] = useState(false)

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  // 从localStorage获取用户名
  useEffect(() => {
    const savedUsername = localStorage.getItem('mc_live_username')
    if (savedUsername) {
      setUsername(savedUsername)
      setIsUsernameSet(true)
    }
  }, [])

  // 保存用户名
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      localStorage.setItem('mc_live_username', username.trim())
      setIsUsernameSet(true)
    }
  }

  // 发送消息
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && isConnected && username) {
      wsManager.sendComment(username, message.trim())
      setMessage('')
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
          实时聊天
          <span className="ml-2 text-sm text-gray-500">
            ({comments.length} 条消息)
          </span>
        </h3>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 p-4 max-h-64 overflow-y-auto custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">暂无聊天消息</p>
            <p className="text-xs">成为第一个发言的人！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        {!isUsernameSet ? (
          // 用户名设置表单
          <form onSubmit={handleUsernameSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                设置昵称后开始聊天
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入你的昵称..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              确认昵称
            </button>
          </form>
        ) : (
          // 消息发送表单
          <form onSubmit={handleMessageSubmit} className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{username}</span>
              <button
                type="button"
                onClick={() => setIsUsernameSet(false)}
                className="text-blue-500 hover:text-blue-600 ml-auto"
              >
                更换昵称
              </button>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isConnected ? "输入消息..." : "连接中..."}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!message.trim() || !isConnected}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {!isConnected && (
              <p className="text-xs text-red-500">
                连接已断开，请等待重连...
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}