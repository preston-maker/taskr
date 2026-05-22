import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Overdue tasks
    const overdue = await query(`
      SELECT * FROM tasks
      WHERE completed = FALSE
        AND due_date < CURRENT_DATE
      ORDER BY due_date ASC
    `)

    // Tasks aging in Tier 2 (decay_score > 3 or sitting for 7+ days)
    const aging = await query(`
      SELECT * FROM tasks
      WHERE completed = FALSE
        AND tier = 2
        AND (decay_score > 3 OR created_at < NOW() - INTERVAL '7 days')
      ORDER BY decay_score DESC, created_at ASC
    `)

    // Skipped recurrings (next_recur_at is in the past)
    const skipped = await query(`
      SELECT * FROM tasks
      WHERE completed = FALSE
        AND is_recurring = TRUE
        AND next_recur_at < NOW()
      ORDER BY next_recur_at ASC
    `)

    // Tier drift: tasks not updated in 7+ days, across any tier
    const drifted = await query(`
      SELECT * FROM tasks
      WHERE completed = FALSE
        AND updated_at < NOW() - INTERVAL '7 days'
        AND id NOT IN (${aging.rows.map((_: unknown, i: number) => `$${i + 1}`).join(',') || 'SELECT id FROM tasks WHERE FALSE'})
      ORDER BY updated_at ASC
      LIMIT 10
    `, aging.rows.length > 0 ? aging.rows.map((r: { id: string }) => r.id) : undefined)

    // Decay score increment (run daily via cron or on review open)
    await query(`
      UPDATE tasks
      SET decay_score = decay_score + 1, updated_at = updated_at
      WHERE completed = FALSE AND tier = 2
    `)

    const lastReview = await query(`
      SELECT completed_at FROM review_sessions ORDER BY completed_at DESC LIMIT 1
    `)

    return NextResponse.json({
      overdue: overdue.rows,
      aging: aging.rows,
      skipped: skipped.rows,
      drifted: drifted.rows,
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
    await query(`INSERT INTO review_sessions (tasks_reviewed) VALUES (0)`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save review session' }, { status: 500 })
  }
}
