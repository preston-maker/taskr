'use client'

import { Task, Tier } from '@/lib/types'
import TaskCard from './TaskCard'
import styles from './TierColumn.module.css'

interface Props {
  tier: Tier
  tasks: Task[]
  onComplete: (id: string) => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
  cap?: number
}

const TIER_META = {
  1: { label: 'do it now', sublabel: 'max 4' },
  2: { label: 'do it soon', sublabel: 'scores decay daily' },
  3: { label: 'backlog', sublabel: 'someday' },
}

export default function TierColumn({ tier, tasks, onComplete, onMove, onDelete, cap }: Props) {
  const meta = TIER_META[tier]
  const isFull = cap !== undefined && tasks.length >= cap
  const sorted = [...tasks].sort((a, b) => {
    if (a.is_revenue && !b.is_revenue) return -1
    if (!a.is_revenue && b.is_revenue) return 1
    return a.sort_order - b.sort_order
  })

  return (
    <div className={`${styles.column} ${styles[`tier${tier}`]}`}>
      <div className={styles.header}>
        <div className={styles.tierNum}>0{tier}</div>
        <div className={styles.tierMeta}>
          <span className={styles.tierLabel}>{meta.label}</span>
          <span className={styles.tierSub}>{meta.sublabel}</span>
        </div>
        <div className={styles.count}>
          {tasks.length}{cap ? `/${cap}` : ''}
          {isFull && <span className={styles.full}>full</span>}
        </div>
      </div>

      <div className={styles.tasks}>
        {sorted.length === 0 && (
          <div className={styles.empty}>
            {tier === 1 ? '— clear' : '— empty'}
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
          />
        ))}
      </div>
    </div>
  )
}
