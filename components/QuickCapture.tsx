'use client'

import { useState, useRef } from 'react'
import { Tier, Tag } from '@/lib/types'
import styles from './QuickCapture.module.css'

interface Props {
  onAdd: (title: string, tier: Tier, tag: Tag, isRevenue: boolean, isRecurring: boolean, recurDays?: number) => void
  tier1Full: boolean
}

export default function QuickCapture({ onAdd, tier1Full }: Props) {
  const [value, setValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [tier, setTier] = useState<Tier>(2)
  const [tag, setTag] = useState<Tag>('admin')
  const [isRevenue, setIsRevenue] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurDays, setRecurDays] = useState(7)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim(), tier, tag, isRevenue, isRecurring, isRecurring ? recurDays : undefined)
    setValue('')
    setExpanded(false)
    setIsRevenue(false)
    setIsRecurring(false)
    setTier(2)
    setTag('admin')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setExpanded(false)
      setValue('')
    }
  }

  const tags: Tag[] = ['sales', 'admin', 'personal', 'revenue']

  return (
    <form className={styles.capture} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>+</span>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="capture a task..."
          value={value}
          onChange={e => { setValue(e.target.value); if (e.target.value && !expanded) setExpanded(true) }}
          onFocus={() => value && setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button type="submit" className={styles.addBtn}>add</button>
        )}
      </div>

      {expanded && value && (
        <div className={styles.options}>
          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>tier</span>
            <div className={styles.pills}>
              {([1, 2, 3] as Tier[]).map(t => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.pill} ${tier === t ? styles.pillActive : ''} ${t === 1 && tier1Full ? styles.pillDisabled : ''}`}
                  onClick={() => t !== 1 || !tier1Full ? setTier(t) : null}
                  title={t === 1 && tier1Full ? 'Tier 1 is full (max 4)' : undefined}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>tag</span>
            <div className={styles.pills}>
              {tags.map(tg => (
                <button
                  key={tg}
                  type="button"
                  className={`${styles.pill} ${tag === tg ? styles.pillActive : ''}`}
                  onClick={() => { setTag(tg); if (tg === 'revenue') setIsRevenue(true) }}
                >
                  {tg}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>flags</span>
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
                <span className={styles.recurInput}>
                  every{' '}
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={recurDays}
                    onChange={e => setRecurDays(Number(e.target.value))}
                    className={styles.recurNum}
                  />{' '}
                  days
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
