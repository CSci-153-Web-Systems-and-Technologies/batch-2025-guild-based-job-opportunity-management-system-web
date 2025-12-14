export interface Role {
  id: number
  name: string
  description?: string | null
}

export interface Rank {
  id: number
  name: string
  min_xp: number
  max_xp: number
}

export interface UserStats {
  user_id: string
  xp: number
  current_rank_id?: number | null
  updated_at?: string | null
}

export interface Profile {
  id: string
  auth_id?: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  avatar_url?: string | null
  role_id?: number | null
}

export interface Party {
  id: number
  name: string
  description?: string | null
  leader_id?: string | null
  created_at?: string | null
}

export interface PartyMember {
  id: number
  party_id: number
  user_id: string
  role?: string | null
  joined_at?: string | null
}

export interface UserStatsWithRank {
  stats: UserStats
  rank?: Rank | null
}

export default {} as const
