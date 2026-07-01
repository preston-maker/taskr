import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { label } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM custom_tiers WHERE user_id = $1', [userId]
    )
    const result = await query(
      'INSERT INTO custom_tiers (label, sort_order, user_id) VALUES ($1, $2, $3) RETURNING *',
      [label.trim(), maxOrder.rows[0].next, userId]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
  }
}
