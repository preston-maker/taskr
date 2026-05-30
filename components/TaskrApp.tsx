'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Tier, Tag, CustomTier, CustomTag } from '@/lib/types'
import TierColumn from './TierColumn'
import QuickCapture from './QuickCapture'
import WeeklyReview from './WeeklyReview'
import SettingsPanel from './SettingsPanel'
import EditModal from './EditModal'
import CompletedHistory from './CompletedHistory'
import styles from './TaskrApp.module.css'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function TaskrApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [tiers, setTiers] = useState<CustomTier[]>([])
  const [tags, setTags] = useState<CustomTag[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState(false)
  const [historyMode, setHistoryMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [activeMobileTier, setActiveMobileTier] = useState(0) // index into tiers array
  const [reviewData, setReviewData] = useState<null | {
    overdue: Task[], aging: Task[], skipped: Task[], drifted: Task[], total: number, lastReview: string | null
  }>(null)
  const isMobile = useIsMobile()

  const fetchTasks = useCallback(async () => {
    const [activeRes, completedRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/tasks/completed'),
    ])
    const active = await activeRes.json()
    const completed = await completedRes.json()
    setTasks(Array.isArray(active) ? active : [])
    setCompletedTasks(Array.isArray(completed) ? completed : [])
  }, [])

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.tiers) setTiers(data.tiers)
    if (data.tags) setTags(data.tags)
  }, [])

  useEffect(() => {
    Promise.all([fetchTasks(), fetchSettings()]).then(() => setLoading(false))
  }, [fetchTasks, fetchSettings])

  const addTask = async (title: string, tier: Tier, tag: Tag, isRevenue: boolean, isRecurring: boolean, recurDays?: number, dueDate?: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, tier, tag, is_revenue: isRevenue, is_recurring: isRecurring, recur_days: recurDays, due_date: dueDate }),
    })
    const task = await res.json()
    if (task.id) setTasks(prev => [...prev, task])
  }

  const completeTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    const updated = await res.json()
    setTasks(prev => prev.filter(t => t.id !== id))
    if (updated.id) setCompletedTasks(prev => [updated, ...prev])
  }

  const restoreTask = async (id: string) => {
    const task = completedTasks.find(t => t.id === id)
    if (!task) return
    setCompletedTasks(prev => prev.filter(t => t.id !== id))
    setTasks(prev => [...prev, { ...task, completed: false, completed_at: undefined }])
  }

  const moveTask = async (id: string, newTier: Tier) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: newTier }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, tier: newTier } : t))
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const openReview = async () => {
    const res = await fetch('/api/review')
    const data = await res.json()
    setReviewData(data)
    setReviewMode(true)
  }

  const closeReview = async () => {
    await fetch('/api/review', { method: 'POST' })
    setReviewMode(false)
    fetchTasks()
  }

  const handleDragStart = (id: string) => setDragId(id)
  const handleDragEnd = () => setDragId(null)
  const handleDropOnTier = async (tierId: Tier) => {
    if (dragId) await moveTask(dragId, tierId)
    setDragId(null)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingDot}>_</span>
      </div>
    )
  }

  if (reviewMode && reviewData) {
    return <WeeklyReview data={reviewData} onClose={closeReview} onMove={moveTask} onDelete={deleteTask} onRefresh={fetchTasks} />
  }

  if (historyMode) {
    return <CompletedHistory tiers={tiers} tags={tags} onClose={() => setHistoryMode(false)} onRestore={restoreTask} />
  }

  const tierColumns = tiers.map(t => ({
    tier: t.id as Tier,
    label: t.label,
    sortOrder: t.sort_order,
    tasks: tasks.filter(task => task.tier === t.id),
    completed: completedTasks.filter(task => task.tier === t.id),
    cap: t.sort_order === 1 ? 4 : undefined,
  }))

  const tier1Full = (tierColumns[0]?.tasks.length ?? 0) >= 4
  const visibleColumns = isMobile ? [tierColumns[activeMobileTier]] : tierColumns

  return (
    <div className={`${styles.app} ${isMobile ? styles.appMobile : ''}`}>
      <header className={styles.header}>
        <div className={styles.wordmark}>taskr</div>
        <div className={styles.headerRight}>
          {!isMobile && (
            <>
              <button className={styles.historyBtn} onClick={() => setHistoryMode(true)}>completed</button>
              <button className={styles.reviewBtn} onClick={openReview}>weekly review</button>
            </>
          )}
          <button className={styles.gearBtn} onClick={() => setSettingsOpen(true)} title="settings">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="2.2"/>
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06"/>
            </svg>
          </button>
        </div>
      </header>

      <QuickCapture onAdd={addTask} tier1Full={tier1Full} tiers={tiers} tags={tags} />

      <main className={styles.main} style={!isMobile ? { gridTemplateColumns: `repeat(${tierColumns.length}, 1fr)` } : undefined}>
        {visibleColumns.filter(Boolean).map(col => (
          <TierColumn
            key={col!.tier}
            tier={col!.tier}
            label={col!.label}
            sortOrder={col!.sortOrder}
            tasks={col!.tasks}
            completedTasks={col!.completed}
            onComplete={completeTask}
            onMove={moveTask}
            onDelete={deleteTask}
            onEdit={setEditingTask}
            onAdd={(title, tag, isRevenue) => addTask(title, col!.tier, tag, isRevenue, false)}
            cap={col!.cap}
            allTiers={tiers}
            tags={tags}
            dragId={dragId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDropOnTier}
          />
        ))}
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav className={styles.mobileNav}>
          {tierColumns.map((col, i) => {
            const count = col.tasks.length
            return (
              <button
                key={col.tier}
                className={`${styles.mobileTab} ${activeMobileTier === i ? styles.mobileTabActive : ''}`}
                onClick={() => setActiveMobileTier(i)}
              >
                <span className={styles.mobileTabNum}>0{col.sortOrder}</span>
                <span className={styles.mobileTabLabel}>{col.label}</span>
                {count > 0 && <span className={styles.mobileTabCount}>{count}</span>}
              </button>
            )
          })}
          <button
            className={styles.mobileTab}
            onClick={() => setHistoryMode(true)}
          >
            <span className={styles.mobileTabNum}>✓</span>
            <span className={styles.mobileTabLabel}>done</span>
          </button>
          <button
            className={styles.mobileTab}
            onClick={openReview}
          >
            <span className={styles.mobileTabNum}>↻</span>
            <span className={styles.mobileTabLabel}>review</span>
          </button>
        </nav>
      )}

      {editingTask && (
        <EditModal task={editingTask} tiers={tiers} tags={tags} onSave={updateTask} onClose={() => setEditingTask(null)} />
      )}

      {settingsOpen && (
        <SettingsPanel
          tiers={tiers}
          tags={tags}
          onClose={() => setSettingsOpen(false)}
          onTierAdded={tier => setTiers(prev => [...prev, tier])}
          onTierDeleted={id => setTiers(prev => prev.filter(t => t.id !== id))}
          onTagAdded={tag => setTags(prev => [...prev, tag])}
          onTagDeleted={id => setTags(prev => prev.filter(t => t.id !== id))}
        />
      )}
    </div>
  )
}
