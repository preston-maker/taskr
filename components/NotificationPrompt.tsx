'use client'

import { useState, useEffect } from 'react'
import styles from './NotificationPrompt.module.css'

export default function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      // Only show if not already decided
      const dismissed = localStorage.getItem('taskr-notif-dismissed')
      if (!dismissed) setShow(true)
    } else if (Notification.permission === 'granted') {
      setStatus('granted')
    }
  }, [])

  const requestPermission = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setStatus('granted')
      setShow(false)
      // Show a test notification
      new Notification('taskr', {
        body: 'Notifications enabled. You\'ll be reminded of due tasks.',
        icon: '/icon-192.png',
      })
    } else {
      setStatus('denied')
      setShow(false)
    }
    localStorage.setItem('taskr-notif-dismissed', '1')
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('taskr-notif-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className={styles.prompt}>
      <span className={styles.text}>enable reminders for due tasks?</span>
      <div className={styles.actions}>
        <button className={styles.enableBtn} onClick={requestPermission}>enable</button>
        <button className={styles.dismissBtn} onClick={dismiss}>not now</button>
      </div>
    </div>
  )
}
