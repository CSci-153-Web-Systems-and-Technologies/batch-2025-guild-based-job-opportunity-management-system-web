export interface Widget {
  id: string
  title: string
  value: string | number
  change?: number // percent change e.g. +12 means +12%
  description?: string
}

export type DashboardData = Widget[]

export default Widget
