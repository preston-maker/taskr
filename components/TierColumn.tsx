'use client'

import { Task, Tier, CustomTier, CustomTag } from '@/lib/types'
import TaskCard from './TaskCard'
import styles from './TierColumn.module.css'

interface Props {
  tier: Tier
  label: string
  sortOrder: number
  tasks: Task[]
  onComplete: (id: string) => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
  cap?: number
  allTiers: CustomTier[]
  tags: CustomTag[]
}

export default function TierColumn({ tier, label, sortOrder, tasks, onComplete, onMove, onDelete, cap, allTiers, tags }: Props) {
  const isFull = cap !== undefined && tasks.length >= cap

  const SUBLABELS: Record<number, string> = { 1: 'max 4', 2: 'scores decay daily', 3: 'someday' }
  const sublabel = SUBLABELS[sortOrder] || ''

  const sorted = [...tasks].sort((a, b) => {
    if (a.is_revenue && !b.is_revenue) return -1
    if (!a.is_revenue && b.is_revenue) return 1
    return a.sort_order - b.sort_order
  })

  const tierNum = String(sortOrder).padStart(2, '0')

  return (
    <div className={`${styles.column} ${sortOrder === 1 ? styles.tier1 : sortOrder === 2 ? styles.tier2 : styles.tier3}`}>
      <div className={styles.header}>
        <div className={styles.tierNum}>{tierNum}</div>
        <div className={styles.tierMeta}>
          <span className={styles.tierLabel}>{label}</span>
          {sublabel && <span className={styles.tierSub}>{sublabel}</span>}
        </div>
        <div className={styles.count}>
          {tasks.length}{cap ? `/${cap}` : ''}
          {isFull && <span className={styles.full}>full</span>}
        </div>
      </div>

      <div className={styles.tasks}>
        {sorted.length === 0 && (
          <div className={styles.empty}>
            {sortOrder === 1 ? '— clear' : '— empty'}
          </div>
        )}
        {sorted.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            tier={tier}
            onComplete={onComplete}
            onMove={onMove}
            onDelete={onDelete}
            allTiers={allTiers}
            tags={tags}
          />
        ))}
      </div>
    </div>
  )
}
