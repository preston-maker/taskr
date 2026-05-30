import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { label } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const result = await query(
      'UPDATE custom_tiers SET label = $1 WHERE id = $2 RETURNING *',
      [label.trim(), params.id]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const tier = await query('SELECT sort_order FROM custom_tiers WHERE id = $1', [params.id])
    if (!tier.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const count = await query('SELECT COUNT(*) FROM custom_tiers')
    if (parseInt(count.rows[0].count) <= 1) {
      return NextResponse.json({ error: 'Must have at least one tier' }, { status: 400 })
    }
    await query('DELETE FROM custom_tiers WHERE id = $1', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}
