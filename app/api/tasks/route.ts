import { NextResponse } from 'next/server'
import { query, initDB } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    await initDB()
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await query(`
      SELECT * FROM tasks
      WHERE completed = FALSE AND user_id = $1
      ORDER BY tier ASC,
        CASE WHEN is_revenue THEN 0 ELSE 1 END ASC,
        sort_order ASC, created_at ASC
    `, [userId])
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await initDB()
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, tier = 2, tag = 'admin', is_revenue = false, is_recurring = false, recur_interval, recur_days, due_date } = body

    const sortResult = await query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM tasks WHERE tier = $1 AND completed = FALSE AND user_id = $2',
      [tier, userId]
    )
    const sortOrder = sortResult.rows[0].next_order
    const nextRecurAt = is_recurring && recur_days ? new Date(Date.now() + recur_days * 86400000).toISOString() : null

    const result = await query(
      `INSERT INTO tasks (title, tier, tag, is_revenue, is_recurring, recur_interval, recur_days, next_recur_at, sort_order, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [title, tier, tag, is_revenue, is_recurring, recur_interval || null, recur_days || null, nextRecurAt, sortOrder, due_date || null, userId]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
