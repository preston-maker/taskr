import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const overdue = await query(`
      SELECT * FROM tasks WHERE completed = FALSE AND user_id = $1 AND due_date < CURRENT_DATE ORDER BY due_date ASC
    `, [userId])

    const aging = await query(`
      SELECT * FROM tasks WHERE completed = FALSE AND user_id = $1 AND tier = 2
        AND (decay_score > 3 OR created_at < NOW() - INTERVAL '7 days')
      ORDER BY decay_score DESC, created_at ASC
    `, [userId])

    const skipped = await query(`
      SELECT * FROM tasks WHERE completed = FALSE AND user_id = $1 AND is_recurring = TRUE AND next_recur_at < NOW()
      ORDER BY next_recur_at ASC
    `, [userId])

    const agingIds = aging.rows.map((r: { id: string }) => r.id)
    const drifted = await query(`
      SELECT * FROM tasks WHERE completed = FALSE AND user_id = $1
        AND updated_at < NOW() - INTERVAL '7 days'
        ${agingIds.length > 0 ? `AND id NOT IN (${agingIds.map((_: unknown, i: number) => `$${i + 2}`).join(',')})` : ''}
      ORDER BY updated_at ASC LIMIT 10
    `, agingIds.length > 0 ? [userId, ...agingIds] : [userId])

    await query(`UPDATE tasks SET decay_score = decay_score + 1, updated_at = updated_at WHERE completed = FALSE AND user_id = $1 AND tier = 2`, [userId])

    const lastReview = await query(`SELECT completed_at FROM review_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`, [userId])

    return NextResponse.json({
      overdue: overdue.rows, aging: aging.rows, skipped: skipped.rows, drifted: drifted.rows,
      lastReview: lastReview.rows[0]?.completed_at || null,
      total: overdue.rows.length + aging.rows.length + skipped.rows.length + drifted.rows.length,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await query(`INSERT INTO review_sessions (user_id) VALUES ($1)`, [userId])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save review session' }, { status: 500 })
  }
}
