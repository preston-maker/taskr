import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id } = params
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    const allowed = ['title', 'tier', 'tag', 'is_revenue', 'is_recurring', 'recur_interval', 'recur_days', 'sort_order', 'completed', 'due_date']
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = $${i++}`)
        values.push(body[key])
      }
    }
    if (body.completed === true) {
      fields.push(`completed_at = $${i++}`)
      values.push(new Date().toISOString())
      fields.push(`last_completed_at = $${i++}`)
      values.push(new Date().toISOString())
    }
    if (body.completed === false) {
      fields.push(`completed_at = $${i++}`)
      values.push(null)
    }
    fields.push(`updated_at = $${i++}`)
    values.push(new Date().toISOString())

    values.push(id)
    values.push(userId)
    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const task = result.rows[0]
    if (body.completed === true && task.is_recurring && task.recur_days) {
      const nextRecurAt = new Date(Date.now() + task.recur_days * 86400000).toISOString()
      await query(
        `INSERT INTO tasks (title, tier, tag, is_revenue, is_recurring, recur_interval, recur_days, next_recur_at, sort_order, user_id)
         VALUES ($1, 2, $2, $3, TRUE, $4, $5, $6, 999, $7)`,
        [task.title, task.tag, task.is_revenue, task.recur_interval, task.recur_days, nextRecurAt, userId]
      )
    }
    return NextResponse.json(task)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
