import type { DashboardData } from '@/types/dashboard'

export const mockDashboard: DashboardData = [
  { id: 'w1', title: 'Active Users', value: 1243, change: 8 },
  { id: 'w2', title: 'Jobs Posted', value: 98, change: -2 },
  { id: 'w3', title: 'Applications', value: 432, change: 12 },
  { id: 'w4', title: 'Open Guilds', value: 14 },
  { id: 'w5', title: 'Average Time to Hire', value: '21 days' },
  { id: 'w6', title: 'New Guild Members', value: 57, change: 4 },
]

export default mockDashboard
