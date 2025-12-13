'use client'

import React, { useState, useCallback } from 'react'
import QuestFilter from '@/components/questboard/QuestFilter'
import JobList from '@/components/dashboard/JobList'

export default function QuestBoardClient() {
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
      <QuestFilter onFilterChange={handleFilterChange} />
      <section className="mt-8">
        <JobList filters={filters} />
      </section>
    </div>
  )
}
