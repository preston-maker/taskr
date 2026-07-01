import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tag = await query(
      'SELECT id FROM custom_tags WHERE id = $1 AND user_id = $2', [params.id, userId]
    )
    if (!tag.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const count = await query('SELECT COUNT(*) FROM custom_tags WHERE user_id = $1', [userId])
    if (parseInt(count.rows[0].count) <= 1) {
      return NextResponse.json({ error: 'Must have at least one tag' }, { status: 400 })
    }
    await query('DELETE FROM custom_tags WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
