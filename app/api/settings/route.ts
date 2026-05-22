import { NextResponse } from 'next/server'
import { query, initDB } from '@/lib/db'

export async function GET() {
  try {
    await initDB()
    const tiers = await query('SELECT * FROM custom_tiers ORDER BY sort_order ASC')
    const tags = await query('SELECT * FROM custom_tags ORDER BY created_at ASC')
    return NextResponse.json({ tiers: tiers.rows, tags: tags.rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
