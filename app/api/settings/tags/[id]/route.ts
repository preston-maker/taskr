import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const tag = await query('SELECT label FROM custom_tags WHERE id = $1', [params.id])
    if (!tag.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const defaults = ['sales', 'admin', 'personal', 'revenue']
    if (defaults.includes(tag.rows[0].label)) {
      return NextResponse.json({ error: 'Cannot delete default tags' }, { status: 400 })
    }
    await query('DELETE FROM custom_tags WHERE id = $1', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
