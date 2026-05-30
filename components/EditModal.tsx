'use client'

import { useState } from 'react'
import { Task, Tier, Tag, CustomTier, CustomTag } from '@/lib/types'
import styles from './EditModal.module.css'

interface Props {
  task: Task
  tiers: CustomTier[]
  tags: CustomTag[]
  onSave: (id: string, updates: Partial<Task>) => void
  onClose: () => void
}

const PRESET_COLORS = [
  '#ffffff','#cccccc','#888888','#555555',
  '#c8a87a','#a3b899','#8ab4c8','#c89aa3',
  '#b8a3c8','#c8c8a3','#a3c8c8','#c8b0a3',
]

export default function EditModal({ task, tiers, tags, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [tierId, setTierId] = useState<number>(task.tier as number)
  const [tag, setTag] = useState<Tag>(task.tag)
  const [isRevenue, setIsRevenue] = useState(task.is_revenue)
  const [isRecurring, setIsRecurring] = useState(task.is_recurring)
  const [recurDays, setRecurDays] = useState(task.recur_days ?? 7)
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    onSave(task.id, {
      title: title.trim(),
      tier: tierId as Tier,
      tag,
      is_revenue: isRevenue,
      is_recurring: isRecurring,
      recur_days: isRecurring ? recurDays : undefined,
      due_date: dueDate || undefined,
    })
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>edit task</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>title</label>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>tier</label>
            <div className={styles.pills}>
              {tiers.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.pill} ${tierId === t.id ? styles.pillActive : ''}`}
                  onClick={() => setTierId(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>tag</label>
            <div className={styles.pills}>
              {tags.map(tg => (
                <button
                  key={tg.id}
                  type="button"
                  className={`${styles.pill} ${tag === tg.label ? styles.pillActive : ''}`}
                  style={tag === tg.label ? { borderColor: tg.color, color: tg.color } : {}}
                  onClick={() => setTag(tg.label)}
                >
                  <span className={styles.dot} style={{ background: tg.color }} />
                  {tg.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>due date</label>
            <div className={styles.row}>
              <input
                type="date"
                className={styles.dateInput}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
              {dueDate && (
                <button className={styles.clearBtn} onClick={() => setDueDate('')}>clear</button>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>flags</label>
            <div className={styles.pills}>
              <button
                type="button"
                className={`${styles.pill} ${isRevenue ? styles.pillActive : ''}`}
                onClick={() => setIsRevenue(v => !v)}
              >
                revenue
              </button>
              <button
                type="button"
                className={`${styles.pill} ${isRecurring ? styles.pillActive : ''}`}
                onClick={() => setIsRecurring(v => !v)}
              >
                recurring
              </button>
              {isRecurring && (
                <span className={styles.recurRow}>
                  every
                  <input
                    type="number"
                    min={1} max={365}
                    value={recurDays}
                    onChange={e => setRecurDays(Number(e.target.value))}
                    className={styles.recurNum}
                  />
                  days
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? 'saving...' : 'save'}
          </button>
        </div>
      </div>
    </div>
  )
}
