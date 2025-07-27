'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Users, Smile } from 'lucide-react'

interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: string
  color?: string
}

interface ChatSectionProps {
  isConnected: boolean
  viewerCount: number
}

const randomColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

const getRandomColor = () => randomColors[Math.floor(Math.random() * randomColors.length)]

const defaultMessages: ChatMessage[] = [
  {
    id: '1',
    username: '观众1',
    message: '白队加油！',
    timestamp: new Date().toISOString(),
    color: '#FF6B6B'
  },
  {
    id: '2', 
    username: 'MinecraftFan',
    message: '这个宾果时速好精彩',
    timestamp: new Date().toISOString(),
    color: '#4ECDC4'
  },
  {
    id: '3',
    username: '游戏爱好者',
    message: 'Venti_Lynn操作太强了！',
    timestamp: new Date().toISOString(),
    color: '#45B7D1'
  }
]

export default function ChatSection({ isConnected, viewerCount }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages)
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 模拟消息生成
  useEffect(() => {
    if (!isConnected) return

    const simulateMessages = () => {
      const sampleMessages = [
        '太精彩了！',
        '这波操作6666',
        '红队加油！',
        '预测白队能拿冠军',
        '这个游戏规则太有趣了',
        '主播解说得很棒',
        '淡蓝队的Venti_Lynn厉害',
        '期待最终对决',
        '分数咬得好紧啊',
        '这个翻盘太刺激了'
      ]
      
      const usernames = [
        '游戏迷', 'MC玩家', '观众' + Math.floor(Math.random() * 1000), 
        '路人甲', '电竞爱好者', '弹幕达人', 'MinecraftLover'
      ]

      const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)]
      const randomUsername = usernames[Math.floor(Math.random() * usernames.length)]

      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        username: randomUsername,
        message: randomMessage,
        timestamp: new Date().toISOString(),
        color: getRandomColor()
      }

      setMessages(prev => {
        const updated = [...prev, newMsg]
        // 严格限制只保留最新30条消息
        return updated.slice(-30)
      })
    }

    // 随机间隔发送模拟消息
    const interval = setInterval(simulateMessages, Math.random() * 8000 + 2000)
    return () => clearInterval(interval)
  }, [isConnected])

  useEffect(() => {
    // 滚动到底部
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !username.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: username.trim(),
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      color: getRandomColor()
    }

    setMessages(prev => {
      const updated = [...prev, message]
      // 严格限制只保留最新30条消息
      return updated.slice(-30)
    })
    setNewMessage('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const emojis = ['😀', '😂', '😍', '🤔', '😎', '🔥', '💪', '👏', '❤️', '⚡']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-green-500 dark:text-green-400" />
          弹幕聊天
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* 用户名输入 */}
      {!username && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <input
            type="text"
            placeholder="输入昵称开始聊天..."
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setUsername(e.currentTarget.value)
              }
            }}
          />
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-hidden mb-4">
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto custom-scrollbar space-y-2"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className="animate-slide-up"
            >
              <div className="flex items-start space-x-2">
                <span 
                  className="text-sm font-semibold shrink-0"
                  style={{ color: message.color }}
                >
                  {message.username}:
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200 break-words">
                  {message.message}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-500 shrink-0 ml-auto">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 输入区域 */}
      {username && (
        <div className="space-y-3">
          {/* 表情选择器 */}
          {showEmojiPicker && (
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-2">
              <div className="grid grid-cols-5 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji)
                      setShowEmojiPicker(false)
                      inputRef.current?.focus()
                    }}
                    className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入框 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入弹幕消息..."
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
                disabled={!isConnected}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 dark:text-gray-500">
                {newMessage.length}/100
              </div>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* 用户信息 */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>当前用户: {username}</span>
            <button
              onClick={() => setUsername('')}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              切换用户
            </button>
          </div>
        </div>
      )}

      {/* 连接状态 */}
      {!isConnected && (
        <div className="text-center text-red-400 text-sm">
          连接断开，无法发送消息
        </div>
      )}
    </div>
  )
}