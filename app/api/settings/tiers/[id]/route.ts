import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { label } = await req.json()
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
    if (tier.rows[0].sort_order <= 3) {
      return NextResponse.json({ error: 'Cannot delete default tiers' }, { status: 400 })
    }
    await query('DELETE FROM custom_tiers WHERE id = $1', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}
