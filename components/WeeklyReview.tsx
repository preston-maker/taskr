'use client'

import { useState } from 'react'
import { Task, Tier } from '@/lib/types'
import styles from './WeeklyReview.module.css'

interface ReviewData {
  overdue: Task[]
  aging: Task[]
  skipped: Task[]
  drifted: Task[]
  total: number
  lastReview: string | null
}

interface Props {
  data: ReviewData
  onClose: () => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ReviewItem({
  task,
  onMove,
  onDelete,
}: {
  task: Task
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
}) {
  const [done, setDone] = useState(false)
  if (done) return null

  return (
    <div className={styles.item}>
      <span className={styles.itemTitle}>{task.title}</span>
      <div className={styles.itemMeta}>
        {task.tag && <span className={styles.itemTag}>{task.tag}</span>}
        {task.decay_score > 0 && <span className={styles.itemDecay}>{task.decay_score}d old</span>}
      </div>
      <div className={styles.itemActions}>
        {([1, 2, 3] as Tier[]).filter(t => t !== task.tier).map(t => (
          <button key={t} className={styles.action} onClick={() => { onMove(task.id, t); setDone(true) }}>
            → tier {t}
          </button>
        ))}
        <button className={styles.actionKeep} onClick={() => setDone(true)}>keep</button>
        <button className={styles.actionDelete} onClick={() => { onDelete(task.id); setDone(true) }}>delete</button>
      </div>
    </div>
  )
}

export default function WeeklyReview({ data, onClose, onMove, onDelete }: Props) {
  const sections = [
    { key: 'overdue', label: 'overdue', tasks: data.overdue ?? [], desc: 'past their due date' },
    { key: 'aging', label: 'aging tasks', tasks: data.aging ?? [], desc: 'decay score elevated' },
    { key: 'skipped', label: 'skipped recurrings', tasks: data.skipped ?? [], desc: 'past their recurrence window' },
    { key: 'drifted', label: 'tier drift', tasks: data.drifted ?? [], desc: 'not touched in 7+ days' },
  ]

  const total = data.total ?? sections.reduce((sum, s) => sum + s.tasks.length, 0)

  const daysSinceReview = data.lastReview
    ? Math.round((Date.now() - new Date(data.lastReview).getTime()) / 86400000)
    : null

  return (
    <div className={styles.review}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>weekly review</span>
          <span className={styles.subtitle}>
            {total} item{total !== 1 ? 's' : ''} need attention
            {daysSinceReview !== null && ` · last review ${daysSinceReview}d ago`}
            {data.lastReview && ` (${formatDate(data.lastReview)})`}
          </span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          done →
        </button>
      </div>

      {total === 0 ? (
        <div className={styles.clean}>
          <span className={styles.cleanIcon}>✓</span>
          <span className={styles.cleanText}>all clear. pipeline is healthy.</span>
        </div>
      ) : (
        <div className={styles.sections}>
          {sections.map(section => section.tasks.length > 0 && (
            <div key={section.key} className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>{section.label}</span>
                <span className={styles.sectionDesc}>{section.desc}</span>
                <span className={styles.sectionCount}>{section.tasks.length}</span>
              </div>
              <div className={styles.items}>
                {section.tasks.map(task => (
                  <ReviewItem
                    key={task.id}
                    task={task}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
