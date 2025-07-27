/**
 * 锦标赛观看页面
 * 支持多阶段比赛和投票环节的观看
 */

import TournamentPageClient from './TournamentPageClient'

export default function TournamentPage() {
  return <TournamentPageClient />
}

export async function generateStaticParams() {
  return [
    { tournamentId: 'default' }
  ]
}