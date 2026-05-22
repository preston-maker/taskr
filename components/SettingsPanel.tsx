'use client'

import { useState } from 'react'
import { CustomTier, CustomTag } from '@/lib/types'
import styles from './SettingsPanel.module.css'

interface Props {
  tiers: CustomTier[]
  tags: CustomTag[]
  onClose: () => void
  onTierAdded: (tier: CustomTier) => void
  onTierDeleted: (id: number) => void
  onTagAdded: (tag: CustomTag) => void
  onTagDeleted: (id: number) => void
}

const PRESET_COLORS = [
  '#ffffff', '#cccccc', '#888888', '#555555',
  '#c8a87a', '#a3b899', '#8ab4c8', '#c89aa3',
  '#b8a3c8', '#c8c8a3', '#a3c8c8', '#c8b0a3',
]

export default function SettingsPanel({ tiers, tags, onClose, onTierAdded, onTierDeleted, onTagAdded, onTagDeleted }: Props) {
  const [tab, setTab] = useState<'tiers' | 'tags'>('tiers')
  const [newTierLabel, setNewTierLabel] = useState('')
  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const addTier = async () => {
    if (!newTierLabel.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/settings/tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTierLabel.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      onTierAdded(data)
      setNewTierLabel('')
    } else {
      setError(data.error)
    }
    setSaving(false)
  }

  const deleteTier = async (id: number) => {
    const res = await fetch(`/api/settings/tiers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      onTierDeleted(id)
    } else {
      setError(data.error)
      setTimeout(() => setError(''), 3000)
    }
  }

  const addTag = async () => {
    if (!newTagLabel.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/settings/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTagLabel.trim(), color: newTagColor }),
    })
    const data = await res.json()
    if (res.ok) {
      onTagAdded(data)
      setNewTagLabel('')
      setNewTagColor('#888888')
    } else {
      setError(data.error)
    }
    setSaving(false)
  }

  const deleteTag = async (id: number) => {
    const res = await fetch(`/api/settings/tags/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      onTagDeleted(id)
    } else {
      setError(data.error)
      setTimeout(() => setError(''), 3000)
    }
  }

  const defaultTierIds = tiers.filter(t => t.sort_order <= 3).map(t => t.id)
  const defaultTagLabels = ['sales', 'admin', 'personal', 'revenue']

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>settings</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'tiers' ? styles.tabActive : ''}`}
            onClick={() => setTab('tiers')}
          >
            tiers
          </button>
          <button
            className={`${styles.tab} ${tab === 'tags' ? styles.tabActive : ''}`}
            onClick={() => setTab('tags')}
          >
            tags
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === 'tiers' && (
          <div className={styles.section}>
            <p className={styles.hint}>default tiers cannot be deleted. custom tiers appear as new columns.</p>
            <div className={styles.list}>
              {tiers.map((tier, i) => (
                <div key={tier.id} className={styles.item}>
                  <span className={styles.itemNum}>0{i + 1}</span>
                  <span className={styles.itemLabel}>{tier.label}</span>
                  {!defaultTierIds.includes(tier.id) && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteTier(tier.id)}
                    >
                      remove
                    </button>
                  )}
                  {defaultTierIds.includes(tier.id) && (
                    <span className={styles.defaultBadge}>default</span>
                  )}
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
              <button
                className={styles.addBtn}
                onClick={addTier}
                disabled={!newTierLabel.trim() || saving}
              >
                add
              </button>
            </div>
          </div>
        )}

        {tab === 'tags' && (
          <div className={styles.section}>
            <p className={styles.hint}>default tags cannot be deleted. tags appear in quick capture and on task cards.</p>
            <div className={styles.list}>
              {tags.map(tag => (
                <div key={tag.id} className={styles.item}>
                  <span className={styles.colorDot} style={{ background: tag.color }} />
                  <span className={styles.itemLabel}>{tag.label}</span>
                  {!defaultTagLabels.includes(tag.label) && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteTag(tag.id)}
                    >
                      remove
                    </button>
                  )}
                  {defaultTagLabels.includes(tag.label) && (
                    <span className={styles.defaultBadge}>default</span>
                  )}
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
              <button
                className={styles.addBtn}
                onClick={addTag}
                disabled={!newTagLabel.trim() || saving}
              >
                add
              </button>
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
      </div>
    </div>
  )
}
