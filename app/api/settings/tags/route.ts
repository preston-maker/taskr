import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { label, color } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const result = await query(
      'INSERT INTO custom_tags (label, color, user_id) VALUES ($1, $2, $3) RETURNING *',
      [label.trim(), color || '#888888', userId]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
