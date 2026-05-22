'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Tier, Tag } from '@/lib/types'
import TierColumn from './TierColumn'
import QuickCapture from './QuickCapture'
import WeeklyReview from './WeeklyReview'
import styles from './TaskrApp.module.css'

export default function TaskrApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewData, setReviewData] = useState<null | {
    aging: Task[], skipped: Task[], drifted: Task[], total: number, lastReview: string | null
  }>(null)

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const addTask = async (title: string, tier: Tier, tag: Tag, isRevenue: boolean, isRecurring: boolean, recurDays?: number) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, tier, tag, is_revenue: isRevenue, is_recurring: isRecurring, recur_days: recurDays }),
    })
    const task = await res.json()
    if (task.id) setTasks(prev => [...prev, task])
  }

  const completeTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const moveTask = async (id: string, newTier: Tier) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: newTier }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, tier: newTier } : t))
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

  const tier1 = tasks.filter(t => t.tier === 1)
  const tier2 = tasks.filter(t => t.tier === 2)
  const tier3 = tasks.filter(t => t.tier === 3)
  const t1Full = tier1.length >= 4

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingDot}>_</span>
      </div>
    )
  }

  if (reviewMode && reviewData) {
    return (
      <WeeklyReview
        data={reviewData}
        onClose={closeReview}
        onMove={moveTask}
        onDelete={deleteTask}
        onRefresh={fetchTasks}
      />
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.wordmark}>taskr</div>
        <div className={styles.headerRight}>
          <button className={styles.reviewBtn} onClick={openReview}>
            weekly review
          </button>
        </div>
      </header>

      <QuickCapture onAdd={addTask} tier1Full={t1Full} />

      <main className={styles.main}>
        <TierColumn
          tier={1}
          tasks={tier1}
          onComplete={completeTask}
          onMove={moveTask}
          onDelete={deleteTask}
          cap={4}
        />
        <TierColumn
          tier={2}
          tasks={tier2}
          onComplete={completeTask}
          onMove={moveTask}
          onDelete={deleteTask}
        />
        <TierColumn
          tier={3}
          tasks={tier3}
          onComplete={completeTask}
          onMove={moveTask}
          onDelete={deleteTask}
        />
      </main>
    </div>
  )
}
