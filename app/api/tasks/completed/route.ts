import { NextResponse } from 'next/server'
import { query, initDB } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    await initDB()
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await query(`
      SELECT * FROM tasks
      WHERE completed = TRUE AND user_id = $1
        AND completed_at > NOW() - INTERVAL '7 days'
      ORDER BY completed_at DESC
    `, [userId])
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch completed tasks' }, { status: 500 })
  }
}
