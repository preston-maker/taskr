import { NextResponse } from 'next/server'
import { query, initDB } from '@/lib/db'
import { getUserId } from '@/lib/auth'

const DEFAULT_TIERS = [
  { label: 'do it now', sort_order: 1 },
  { label: 'do it soon', sort_order: 2 },
  { label: 'later', sort_order: 3 },
]
const DEFAULT_TAGS = [
  { label: 'sales', color: '#c8c8c8' },
  { label: 'admin', color: '#aaaaaa' },
  { label: 'personal', color: '#bbbbbb' },
  { label: 'revenue', color: '#ffffff' },
]

async function ensureUserDefaults(userId: string) {
  const existing = await query('SELECT COUNT(*) FROM custom_tiers WHERE user_id = $1', [userId])
  if (parseInt(existing.rows[0].count) === 0) {
    // Copy legacy (unowned) tiers if they exist, else seed defaults
    const legacy = await query('SELECT * FROM custom_tiers WHERE user_id IS NULL ORDER BY sort_order ASC')
    const source = legacy.rows.length > 0 ? legacy.rows : DEFAULT_TIERS
    for (const t of source) {
      const inserted = await query(
        'INSERT INTO custom_tiers (label, sort_order, user_id) VALUES ($1, $2, $3) RETURNING id',
        [t.label, t.sort_order, userId]
      )
      // Remap this user's tasks from legacy tier id to their new tier id
      if ('id' in t) {
        await query('UPDATE tasks SET tier = $1 WHERE tier = $2 AND user_id = $3', [
          inserted.rows[0].id, t.id, userId,
        ])
      }
    }
  }

  const existingTags = await query('SELECT COUNT(*) FROM custom_tags WHERE user_id = $1', [userId])
  if (parseInt(existingTags.rows[0].count) === 0) {
    const legacy = await query('SELECT * FROM custom_tags WHERE user_id IS NULL ORDER BY created_at ASC')
    const source = legacy.rows.length > 0 ? legacy.rows : DEFAULT_TAGS
    for (const t of source) {
      await query('INSERT INTO custom_tags (label, color, user_id) VALUES ($1, $2, $3)', [
        t.label, t.color, userId,
      ])
    }
  }
}

export async function GET() {
  try {
    await initDB()
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUserDefaults(userId)

    const tiers = await query('SELECT * FROM custom_tiers WHERE user_id = $1 ORDER BY sort_order ASC', [userId])
    const tags = await query('SELECT * FROM custom_tags WHERE user_id = $1 ORDER BY created_at ASC', [userId])
    return NextResponse.json({ tiers: tiers.rows, tags: tags.rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
