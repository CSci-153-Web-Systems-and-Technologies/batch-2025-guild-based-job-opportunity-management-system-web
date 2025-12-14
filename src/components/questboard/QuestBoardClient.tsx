'use client'

import React, { useState, useCallback } from 'react'
import QuestFilter from '@/components/questboard/QuestFilter'
import JobList from '@/components/dashboard/JobList'

interface QuestBoardClientProps {
  isAdmin?: boolean
}

export default function QuestBoardClient({ isAdmin }: QuestBoardClientProps) {
  const [filters, setFilters] = useState({
    difficulty: 'All Difficulties',
    category: 'All Categories',
    datePosted: 'Recent',
  })

  const handleFilterChange = useCallback((next: typeof filters) => {
    setFilters(next)
  }, [])

  return (
    <div>
      <QuestFilter onFilterChange={handleFilterChange} isAdmin={isAdmin} />
      <section className="mt-8">
        <JobList filters={filters} />
      </section>
    </div>
  )
}
