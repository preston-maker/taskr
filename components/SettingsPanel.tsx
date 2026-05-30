'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { CustomTier, CustomTag } from '@/lib/types'
import styles from './SettingsPanel.module.css'

interface Props {
  tiers: CustomTier[]
  tags: CustomTag[]
  onClose: () => void
  onTierAdded: (tier: CustomTier) => void
  onTierDeleted: (id: number) => void
  onTierUpdated: (tier: CustomTier) => void
  onTagAdded: (tag: CustomTag) => void
  onTagDeleted: (id: number) => void
  onReview?: () => void
  onHistory?: () => void
  isMobile?: boolean
}

const PRESET_COLORS = [
  '#ffffff', '#cccccc', '#888888', '#555555',
  '#c8a87a', '#a3b899', '#8ab4c8', '#c89aa3',
  '#b8a3c8', '#c8c8a3', '#a3c8c8', '#c8b0a3',
]

export default function SettingsPanel({
  tiers, tags, onClose, onTierAdded, onTierDeleted, onTierUpdated,
  onTagAdded, onTagDeleted, onReview, onHistory, isMobile
}: Props) {
  const [tab, setTab] = useState<'tiers' | 'tags'>('tiers')
  const [newTierLabel, setNewTierLabel] = useState('')
  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [editingTierId, setEditingTierId] = useState<number | null>(null)
  const [editingTierLabel, setEditingTierLabel] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: session } = useSession()

  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(''), 3000)
  }

  const addTier = async () => {
    if (!newTierLabel.trim()) return
    setSaving(true)
    const res = await fetch('/api/settings/tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTierLabel.trim() }),
    })
    const data = await res.json()
    if (res.ok) { onTierAdded(data); setNewTierLabel('') }
    else showError(data.error)
    setSaving(false)
  }

  const saveTierEdit = async (id: number) => {
    if (!editingTierLabel.trim()) return
    const res = await fetch(`/api/settings/tiers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editingTierLabel.trim() }),
    })
    const data = await res.json()
    if (res.ok) { onTierUpdated(data); setEditingTierId(null) }
    else showError(data.error)
  }

  const deleteTier = async (id: number) => {
    const res = await fetch(`/api/settings/tiers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) onTierDeleted(id)
    else showError(data.error)
  }

  const addTag = async () => {
    if (!newTagLabel.trim()) return
    setSaving(true)
    const res = await fetch('/api/settings/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTagLabel.trim(), color: newTagColor }),
    })
    const data = await res.json()
    if (res.ok) { onTagAdded(data); setNewTagLabel(''); setNewTagColor('#888888') }
    else showError(data.error)
    setSaving(false)
  }

  const deleteTag = async (id: number) => {
    const res = await fetch(`/api/settings/tags/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) onTagDeleted(id)
    else showError(data.error)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>settings</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'tiers' ? styles.tabActive : ''}`} onClick={() => setTab('tiers')}>tiers</button>
          <button className={`${styles.tab} ${tab === 'tags' ? styles.tabActive : ''}`} onClick={() => setTab('tags')}>tags</button>
        </div>

        {isMobile && (onReview || onHistory) && (
          <div className={styles.mobileActions}>
            {onHistory && (
              <button className={styles.mobileAction} onClick={() => { onHistory(); onClose() }}>
                <span>✓</span> completed history
              </button>
            )}
            {onReview && (
              <button className={styles.mobileAction} onClick={() => { onReview(); onClose() }}>
                <span>↻</span> weekly review
              </button>
            )}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {tab === 'tiers' && (
          <div className={styles.section}>
            <p className={styles.hint}>drag to reorder · click label to edit · must keep at least one tier</p>
            <div className={styles.list}>
              {tiers.map((tier, i) => (
                <div key={tier.id} className={styles.item}>
                  <span className={styles.itemNum}>0{i + 1}</span>
                  {editingTierId === tier.id ? (
                    <input
                      className={styles.editInput}
                      value={editingTierLabel}
                      onChange={e => setEditingTierLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveTierEdit(tier.id)
                        if (e.key === 'Escape') setEditingTierId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      className={styles.itemLabelBtn}
                      onClick={() => { setEditingTierId(tier.id); setEditingTierLabel(tier.label) }}
                    >
                      {tier.label}
                    </button>
                  )}
                  <div className={styles.itemActions}>
                    {editingTierId === tier.id ? (
                      <>
                        <button className={styles.saveBtn2} onClick={() => saveTierEdit(tier.id)}>save</button>
                        <button className={styles.cancelBtn2} onClick={() => setEditingTierId(null)}>×</button>
                      </>
                    ) : (
                      <button className={styles.deleteBtn} onClick={() => deleteTier(tier.id)}>remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.addRow}>
              <input
                className={styles.addInput}
                placeholder="new tier label..."
                value={newTierLabel}
                onChange={e => setNewTierLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTier()}
              />
              <button className={styles.addBtn} onClick={addTier} disabled={!newTierLabel.trim() || saving}>add</button>
            </div>
          </div>
        )}

        {tab === 'tags' && (
          <div className={styles.section}>
            <p className={styles.hint}>must keep at least one tag</p>
            <div className={styles.list}>
              {tags.map(tag => (
                <div key={tag.id} className={styles.item}>
                  <span className={styles.colorDot} style={{ background: tag.color }} />
                  <span className={styles.itemLabel}>{tag.label}</span>
                  <button className={styles.deleteBtn} onClick={() => deleteTag(tag.id)}>remove</button>
                </div>
              ))}
            </div>
            <div className={styles.addRow}>
              <input
                className={styles.addInput}
                placeholder="new tag label..."
                value={newTagLabel}
                onChange={e => setNewTagLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newTagLabel.trim() && addTag()}
              />
              <button className={styles.addBtn} onClick={addTag} disabled={!newTagLabel.trim() || saving}>add</button>
            </div>
            <div className={styles.colorPicker}>
              <span className={styles.colorLabel}>color</span>
              <div className={styles.colorSwatches}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={`${styles.swatch} ${newTagColor === c ? styles.swatchActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewTagColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account / sign out */}
        <div className={styles.account}>
          {session?.user && (
            <div className={styles.accountUser}>
              {session.user.image && <img src={session.user.image} className={styles.accountAvatar} alt="" />}
              <div className={styles.accountInfo}>
                <span className={styles.accountName}>{session.user.name}</span>
                <span className={styles.accountEmail}>{session.user.email}</span>
              </div>
            </div>
          )}
          <button className={styles.signOutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
            sign out
          </button>
        </div>
      </div>
    </div>
  )
}
