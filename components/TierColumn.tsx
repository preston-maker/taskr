'use client'

import { useState, useRef } from 'react'
import { Task, Tier, Tag, CustomTier, CustomTag } from '@/lib/types'
import TaskCard from './TaskCard'
import styles from './TierColumn.module.css'

interface Props {
  tier: Tier
  label: string
  sortOrder: number
  tasks: Task[]
  completedTasks: Task[]
  onComplete: (id: string) => void
  onMove: (id: string, tier: Tier) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onAdd: (title: string, tag: Tag, isRevenue: boolean) => void
  cap?: number
  allTiers: CustomTier[]
  tags: CustomTag[]
  dragId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (tier: Tier) => void
}

const SUBLABELS: Record<number, string> = { 1: 'max 4', 2: 'scores decay daily', 3: 'someday' }

export default function TierColumn({
  tier, label, sortOrder, tasks, completedTasks,
  onComplete, onMove, onDelete, onEdit, onAdd,
  cap, allTiers, tags, dragId, onDragStart, onDragEnd, onDrop
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [showInlineAdd, setShowInlineAdd] = useState(false)
  const [inlineTitle, setInlineTitle] = useState('')
  const [inlineTag, setInlineTag] = useState(tags[1]?.label ?? 'admin')
  const [inlineRevenue, setInlineRevenue] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isFull = cap !== undefined && tasks.length >= cap
  const sublabel = SUBLABELS[sortOrder] || ''
  const tierNum = String(sortOrder).padStart(2, '0')

  const sorted = [...tasks].sort((a, b) => {
    if (a.is_revenue && !b.is_revenue) return -1
    if (!a.is_revenue && b.is_revenue) return 1
    return a.sort_order - b.sort_order
  })

  const handleInlineSubmit = () => {
    if (!inlineTitle.trim()) { setShowInlineAdd(false); return }
    onAdd(inlineTitle.trim(), inlineTag, inlineRevenue)
    setInlineTitle('')
    setInlineRevenue(false)
    setShowInlineAdd(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(tier)
  }

  return (
    <div
      className={`${styles.column} ${sortOrder === 1 ? styles.tier1 : sortOrder === 2 ? styles.tier2 : styles.tier3} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.header}>
        <div className={styles.tierNum}>{tierNum}</div>
        <div className={styles.tierMeta}>
          <span className={styles.tierLabel}>{label}</span>
          {sublabel && <span className={styles.tierSub}>{sublabel}</span>}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.count}>
            {tasks.length}{cap ? `/${cap}` : ''}
            {isFull && <span className={styles.full}>full</span>}
          </div>
          <button
            className={styles.addColBtn}
            onClick={() => { setShowInlineAdd(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            title="add task here"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.tasks}>
        {sorted.length === 0 && !showInlineAdd && (
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
            onEdit={onEdit}
            allTiers={allTiers}
            tags={tags}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {showInlineAdd && (
          <div className={styles.inlineAdd}>
            <input
              ref={inputRef}
              className={styles.inlineInput}
              placeholder="task title..."
              value={inlineTitle}
              onChange={e => setInlineTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleInlineSubmit()
                if (e.key === 'Escape') { setShowInlineAdd(false); setInlineTitle('') }
              }}
            />
            <div className={styles.inlineOptions}>
              <select
                className={styles.inlineSelect}
                value={inlineTag}
                onChange={e => setInlineTag(e.target.value)}
              >
                {tags.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
              </select>
              <button
                className={`${styles.inlineFlag} ${inlineRevenue ? styles.inlineFlagActive : ''}`}
                onClick={() => setInlineRevenue(v => !v)}
              >$</button>
              <button className={styles.inlineConfirm} onClick={handleInlineSubmit}>add</button>
              <button className={styles.inlineCancel} onClick={() => { setShowInlineAdd(false); setInlineTitle('') }}>×</button>
            </div>
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className={styles.completedSection}>
          <button
            className={styles.completedToggle}
            onClick={() => setShowCompleted(v => !v)}
          >
            <span className={styles.completedToggleArrow}>{showCompleted ? '▾' : '▸'}</span>
            <span>completed ({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className={styles.completedList}>
              {completedTasks.map(task => (
                <div key={task.id} className={styles.completedItem}>
                  <span className={styles.completedCheck}>✓</span>
                  <span className={styles.completedTitle}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
