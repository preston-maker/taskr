'use client'

import { useState } from 'react'
import { Task, Tier, CustomTier, CustomTag } from '@/lib/types'
import styles from './TaskCard.module.css'

interface Props {
  task: Task
  tier: Tier
  onComplete: (id: string) => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
  allTiers: CustomTier[]
  tags: CustomTag[]
}

function formatDue(dateStr: string): { label: string; status: 'overdue' | 'today' | 'soon' | 'future' } {
  const due = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, status: 'overdue' }
  if (diff === 0) return { label: 'today', status: 'today' }
  if (diff === 1) return { label: 'tomorrow', status: 'soon' }
  if (diff <= 7) return { label: `${diff}d`, status: 'soon' }
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'future' }
}

export default function TaskCard({ task, tier, onComplete, onMove, onDelete, allTiers, tags }: Props) {
  const [hovering, setHovering] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    if (confirming) {
      onDelete(task.id)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 2500)
    }
  }

  const moveTargets = allTiers.filter(t => t.id !== tier)
  const decayClass = task.decay_score > 6 ? styles.decayHigh : task.decay_score > 3 ? styles.decayMid : ''
  const due = task.due_date ? formatDue(task.due_date) : null
  const tagDef = tags.find(t => t.label === task.tag)
  const tagColor = tagDef?.color || '#888888'

  return (
    <div
      className={`${styles.card} ${task.is_revenue ? styles.revenue : ''} ${decayClass} ${due?.status === 'overdue' ? styles.overdue : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setConfirming(false) }}
    >
      <div className={styles.main}>
        <button className={styles.check} onClick={() => onComplete(task.id)} title="mark complete">
          <span className={styles.checkInner} />
        </button>
        <span className={styles.title}>{task.title}</span>
        <div className={styles.badges}>
          {due && (
            <span className={`${styles.badge} ${styles[`due_${due.status}`]}`}>
              {due.label}
            </span>
          )}
          {task.is_revenue && <span className={styles.badge} data-type="revenue">$</span>}
          {task.is_recurring && <span className={styles.badge} data-type="recurring">↻</span>}
          <span className={styles.badge} style={{ color: tagColor, borderColor: `${tagColor}33` }}>
            {task.tag}
          </span>
          {task.decay_score > 3 && (
            <span className={styles.badge} data-type="decay">{task.decay_score}d</span>
          )}
        </div>
      </div>

      {hovering && (
        <div className={styles.actions}>
          {moveTargets.map(t => (
            <button key={t.id} className={styles.action} onClick={() => onMove(task.id, t.id as Tier)}>
              →{t.label}
            </button>
          ))}
          <button
            className={`${styles.action} ${styles.actionDelete} ${confirming ? styles.actionConfirm : ''}`}
            onClick={handleDelete}
          >
            {confirming ? 'sure?' : 'del'}
          </button>
        </div>
      )}
    </div>
  )
}
