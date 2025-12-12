"use client"

import React from 'react'
import { PartyCard } from './PartyCard'

const dummyParties = [
  {
    id: '1',
    name: 'Code Warriors',
    leader: 'Sarah Maes',
    categories: ['AI/ML', 'Data Science'],
    description: 'A dedicated team focused on the competitive programming and algorithm mastery. We...',
    members: [
      {
        id: 'm1',
        email: 'sarahmaes@vsu.edu.ph',
        role: 'leader',
        avatar: undefined,
      },
      {
        id: 'm2',
        email: 'sarahmaes@vsu.edu.ph',
        role: 'leader',
        avatar: undefined,
      },
    ],
    maxMembers: 5,
    isBookmarked: false,
  },
  {
    id: '2',
    name: 'Web Wizards',
    leader: 'John Doe',
    categories: ['Web Development', 'Frontend'],
    description: 'A team specializing in modern web development and creating beautiful user experiences...',
    members: [
      {
        id: 'm3',
        email: 'johndoe@vsu.edu.ph',
        role: 'leader',
        avatar: undefined,
      },
      {
        id: 'm4',
        email: 'janedoe@vsu.edu.ph',
        role: 'member',
        avatar: undefined,
      },
      {
        id: 'm5',
        email: 'bobsmith@vsu.edu.ph',
        role: 'member',
        avatar: undefined,
      },
    ],
    maxMembers: 4,
    isBookmarked: false,
  },
  {
    id: '3',
    name: 'Cloud Architects',
    leader: 'Mike Johnson',
    categories: ['DevOps', 'Cloud'],
    description: 'Building scalable cloud infrastructure and deployment solutions for enterprise applications...',
    members: [
      {
        id: 'm6',
        email: 'mikejohnson@vsu.edu.ph',
        role: 'leader',
        avatar: undefined,
      },
      {
        id: 'm7',
        email: 'sarahlee@vsu.edu.ph',
        role: 'member',
        avatar: undefined,
      },
    ],
    maxMembers: 6,
    isBookmarked: false,
  },
]

export default function PartyList() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {dummyParties.map((party) => (
        <PartyCard
          key={party.id}
          {...party}
          size="medium"
        />
      ))}
    </div>
  )
}
