import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { label, color } = await req.json()
    if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
    const result = await query(
      'INSERT INTO custom_tags (label, color) VALUES ($1, $2) RETURNING *',
      [label.trim().toLowerCase(), color || '#888888']
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
