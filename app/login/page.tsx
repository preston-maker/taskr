'use client'

import { signIn } from 'next-auth/react'
import styles from './login.module.css'

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.wordmark}>taskr</div>
        <p className={styles.tagline}>three tiers. no noise.</p>
        <button className={styles.googleBtn} onClick={() => signIn('google', { callbackUrl: '/' })}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.52-1.4 2.4-3.46 2.4-5.88z" fill="#4285F4"/>
            <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.58-2a4.8 4.8 0 0 1-7.17-2.52H.94v2.07A8 8 0 0 0 8 16z" fill="#34A853"/>
            <path d="M3.55 9.54A4.83 4.83 0 0 1 3.3 8c0-.54.09-1.06.25-1.54V4.39H.94A8 8 0 0 0 0 8c0 1.29.31 2.51.94 3.61l2.61-2.07z" fill="#FBBC05"/>
            <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A8 8 0 0 0 .94 4.39L3.55 6.46A4.77 4.77 0 0 1 8 3.18z" fill="#EA4335"/>
          </svg>
          sign in with google
        </button>
      </div>
    </div>
  )
}
