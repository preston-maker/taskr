export type Tag = string
export type Tier = number

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
  due_date?: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CustomTier {
  id: number
  label: string
  sort_order: number
}

export interface CustomTag {
  id: number
  label: string
  color: string
}
