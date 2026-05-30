'use client'

import { useState, useEffect } from 'react'
import { Task, Tier, CustomTier, CustomTag } from '@/lib/types'
import styles from './CompletedHistory.module.css'

interface Props {
  tiers: CustomTier[]
  tags: CustomTag[]
  onClose: () => void
  onRestore: (id: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function CompletedHistory({ tiers, tags, onClose, onRestore }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/tasks/completed')
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const handleRestore = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false }),
    })
    setRestoredIds(prev => new Set([...prev, task.id]))
    onRestore(task.id)
  }

  const tierLabel = (tierId: number) => tiers.find(t => t.id === tierId)?.label ?? `tier ${tierId}`
  const tagColor = (tagLabel: string) => tags.find(t => t.label === tagLabel)?.color ?? '#888'

  const grouped = tasks.reduce((acc, task) => {
    const day = task.completed_at
      ? new Date(task.completed_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : 'unknown'
    if (!acc[day]) acc[day] = []
    acc[day].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>completed</span>
          <span className={styles.subtitle}>last 7 days · {tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>← back</button>
      </div>

      {loading && <div className={styles.empty}>loading...</div>}
      {!loading && tasks.length === 0 && (
        <div className={styles.empty}>no completed tasks in the last 7 days</div>
      )}

      {!loading && Object.entries(grouped).map(([day, dayTasks]) => (
        <div key={day} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className={styles.groupDay}>{day}</span>
            <span className={styles.groupCount}>{dayTasks.length}</span>
          </div>
          {dayTasks.map(task => {
            const restored = restoredIds.has(task.id)
            return (
              <div key={task.id} className={`${styles.item} ${restored ? styles.itemRestored : ''}`}>
                <span className={styles.itemCheck}>✓</span>
                <span className={styles.itemTitle}>{task.title}</span>
                <div className={styles.itemMeta}>
                  <span className={styles.itemTag} style={{ color: tagColor(task.tag) }}>{task.tag}</span>
                  <span className={styles.itemTier}>{tierLabel(task.tier as number)}</span>
                  {task.completed_at && (
                    <span className={styles.itemTime}>{timeAgo(task.completed_at)}</span>
                  )}
                </div>
                {!restored && (
                  <button className={styles.restoreBtn} onClick={() => handleRestore(task)}>
                    undo
                  </button>
                )}
                {restored && <span className={styles.restoredLabel}>restored</span>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
