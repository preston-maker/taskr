import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { label } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const maxOrder = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM custom_tiers')
    const result = await query(
      'INSERT INTO custom_tiers (label, sort_order) VALUES ($1, $2) RETURNING *',
      [label.trim(), maxOrder.rows[0].next]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
  }
}
