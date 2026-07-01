'use client'

import { useState, useRef, useEffect } from 'react'
import { Tier, Tag, CustomTier, CustomTag } from '@/lib/types'
import styles from './QuickCapture.module.css'

interface Props {
  onAdd: (title: string, tier: Tier, tag: Tag, isRevenue: boolean, isRecurring: boolean, recurDays?: number, dueDate?: string) => void
  tier1Full: boolean
  tiers: CustomTier[]
  tags: CustomTag[]
}

export default function QuickCapture({ onAdd, tier1Full, tiers, tags }: Props) {
  const [value, setValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [tierId, setTierId] = useState<number>(tiers[1]?.id ?? tiers[0]?.id ?? 2)
  const [tag, setTag] = useState<Tag>(tags[1]?.label ?? tags[0]?.label ?? 'admin')
  const [isRevenue, setIsRevenue] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurDays, setRecurDays] = useState(7)
  const [dueDate, setDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep defaults valid once tiers/tags load asynchronously
  useEffect(() => {
    if (tiers.length && !tiers.some(t => t.id === tierId)) {
      setTierId(tiers[1]?.id ?? tiers[0].id)
    }
  }, [tiers, tierId])
  useEffect(() => {
    if (tags.length && !tags.some(t => t.label === tag)) {
      setTag(tags[1]?.label ?? tags[0].label)
    }
  }, [tags, tag])

  const tier1Id = tiers[0]?.id

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim(), tierId as Tier, tag, isRevenue, isRecurring, isRecurring ? recurDays : undefined, dueDate || undefined)
    setValue('')
    setExpanded(false)
    setIsRevenue(false)
    setIsRecurring(false)
    setDueDate('')
    setTierId(tiers[1]?.id ?? 2)
    setTag(tags[1]?.label ?? 'admin')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setExpanded(false); setValue('') }
  }

  return (
    <form className={styles.capture} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>+</span>
        <input
          ref={inputRef}
          id="quick-capture-input"
          className={styles.input}
          placeholder="capture a task..."
          value={value}
          onChange={e => { setValue(e.target.value); if (e.target.value && !expanded) setExpanded(true) }}
          onFocus={() => value && setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        {value && <button type="submit" className={styles.addBtn}>add</button>}
      </div>

      {expanded && value && (
        <div className={styles.options}>
          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>tier</span>
            <div className={styles.pills}>
              {tiers.map(t => {
                const isFull = t.id === tier1Id && tier1Full
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.pill} ${tierId === t.id ? styles.pillActive : ''} ${isFull ? styles.pillDisabled : ''}`}
                    onClick={() => !isFull && setTierId(t.id)}
                    title={isFull ? 'Tier 1 is full (max 4)' : undefined}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>tag</span>
            <div className={styles.pills}>
              {tags.map(tg => (
                <button
                  key={tg.id}
                  type="button"
                  className={`${styles.pill} ${tag === tg.label ? styles.pillActive : ''}`}
                  style={tag === tg.label ? { borderColor: tg.color, color: tg.color } : {}}
                  onClick={() => { setTag(tg.label); if (tg.label === 'revenue') setIsRevenue(true) }}
                >
                  <span className={styles.tagDot} style={{ background: tg.color }} />
                  {tg.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <span className={styles.optLabel}>due</span>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={styles.dateInput}
            />
            {dueDate && (
              <button type="button" className={styles.clearDate} onClick={() => setDueDate('')}>×</button>
            )}
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
