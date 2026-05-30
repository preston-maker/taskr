import { NextResponse } from 'next/server'
import { query, initDB } from '@/lib/db'

export async function GET() {
  try {
    await initDB()
    const result = await query(`
      SELECT * FROM tasks
      WHERE completed = TRUE
        AND completed_at > NOW() - INTERVAL '7 days'
      ORDER BY completed_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch completed tasks' }, { status: 500 })
  }
}
