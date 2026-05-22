export type Tag = 'revenue' | 'sales' | 'admin' | 'personal'
export type Tier = 1 | 2 | 3

export interface Task {
  id: string
  title: string
  tier: Tier
  tag: Tag
  is_revenue: boolean
  is_recurring: boolean
  recur_interval?: string
  recur_days?: number
  next_recur_at?: string
  last_completed_at?: string
  decay_score: number
  sort_order: number
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}
