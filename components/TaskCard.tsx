'use client'

import { useState } from 'react'
import { Task, Tier } from '@/lib/types'
import styles from './TaskCard.module.css'

interface Props {
  task: Task
  tier: Tier
  onComplete: (id: string) => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
}

export default function TaskCard({ task, tier, onComplete, onMove, onDelete }: Props) {
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

  const moveTargets = ([1, 2, 3] as Tier[]).filter(t => t !== tier)

  const decayClass = task.decay_score > 6 ? styles.decayHigh : task.decay_score > 3 ? styles.decayMid : ''

  return (
    <div
      className={`${styles.card} ${task.is_revenue ? styles.revenue : ''} ${decayClass}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setConfirming(false) }}
    >
      <div className={styles.main}>
        <button
          className={styles.check}
          onClick={() => onComplete(task.id)}
          title="mark complete"
        >
          <span className={styles.checkInner} />
        </button>

        <span className={styles.title}>{task.title}</span>

        <div className={styles.badges}>
          {task.is_revenue && <span className={styles.badge} data-type="revenue">$</span>}
          {task.is_recurring && <span className={styles.badge} data-type="recurring">↻</span>}
          <span className={styles.badge} data-type={task.tag}>{task.tag}</span>
          {task.decay_score > 3 && (
            <span className={styles.badge} data-type="decay">{task.decay_score}d</span>
          )}
        </div>
      </div>

      {hovering && (
        <div className={styles.actions}>
          {moveTargets.map(t => (
            <button
              key={t}
              className={styles.action}
              onClick={() => onMove(task.id, t)}
              title={`move to tier ${t}`}
            >
              →{t}
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
