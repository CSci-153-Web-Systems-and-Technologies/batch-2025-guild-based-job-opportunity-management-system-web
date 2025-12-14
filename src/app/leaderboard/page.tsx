import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import TopRankersSection from '@/components/leaderboard/TopRankersSection'
import FullLeaderboardTable from '@/components/leaderboard/FullLeaderboardTable'

export default async function LeaderboardPage() {
  return (
    <main className="p-6">
      <Topbar />

      {/* Leaderboard Header */}
      <LeaderboardHeader />

      {/* Top Rankers Section - 3 card display */}
      <TopRankersSection />

      {/* Full Leaderboard Table */}
      <FullLeaderboardTable />
    </main>
  )
}
