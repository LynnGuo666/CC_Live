'use client'

import { useState } from 'react'
import { Settings, AlertCircle, Wrench, Clock, Mail } from 'lucide-react'

export default function SettingsPage() {
  const [isUnderMaintenance] = useState(true)

  if (isUnderMaintenance) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          {/* 维护图标 */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-full">
                <Wrench className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="absolute -top-2 -right-2 bg-orange-500 p-2 rounded-full animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            系统维护中
          </h1>

          {/* 描述 */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            设置页面正在进行系统升级和优化，暂时无法访问。
          </p>

          {/* 预计时间 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300">
              <Clock className="w-5 h-5" />
              <span className="font-medium">预计恢复时间：2-3小时</span>
            </div>
          </div>

          {/* 维护内容 */}
          <div className="text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              本次维护内容：
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• 用户设置界面重构</li>
              <li>• 新增主题自定义选项</li>
              <li>• 性能优化和bug修复</li>
              <li>• 安全性增强</li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="text-sm">
              如有紧急问题，请联系：support@example.com
            </span>
          </div>

          {/* 返回按钮 */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>返回上一页</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 正常设置页面（当维护完成后显示）
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            系统设置
          </h1>
        </div>

        {/* 设置内容将在这里显示 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            设置页面内容即将推出...
          </p>
        </div>
      </div>
    </div>
  )
}