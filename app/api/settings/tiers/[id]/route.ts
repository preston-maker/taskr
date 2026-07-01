import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { label } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const result = await query(
      'UPDATE custom_tiers SET label = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [label.trim(), params.id, userId]
    )
    if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tier = await query(
      'SELECT id FROM custom_tiers WHERE id = $1 AND user_id = $2', [params.id, userId]
    )
    if (!tier.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const count = await query('SELECT COUNT(*) FROM custom_tiers WHERE user_id = $1', [userId])
    if (parseInt(count.rows[0].count) <= 1) {
      return NextResponse.json({ error: 'Must have at least one tier' }, { status: 400 })
    }
    // Move stranded tasks to the user's first remaining tier so they stay visible
    const fallback = await query(
      'SELECT id FROM custom_tiers WHERE user_id = $1 AND id != $2 ORDER BY sort_order ASC LIMIT 1',
      [userId, params.id]
    )
    await query('UPDATE tasks SET tier = $1 WHERE tier = $2 AND user_id = $3', [
      fallback.rows[0].id, params.id, userId,
    ])
    await query('DELETE FROM custom_tiers WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true, movedTo: fallback.rows[0].id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}
