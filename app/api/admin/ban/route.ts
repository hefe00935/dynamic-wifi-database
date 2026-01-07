import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    
    const banned = db.prepare(`
      SELECT u.id, u.username, b.reason, b.banned_at, b.banned_by
      FROM users u
      INNER JOIN banned_users b ON u.id = b.user_id
      ORDER BY b.banned_at DESC
    `).all() as any[]
    
    return NextResponse.json({ data: banned, error: null })
  } catch (error: any) {
    console.error('Error fetching banned users:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, action, reason, admin_id } = body

    if (!user_id || !action) {
      return NextResponse.json(
        { data: null, error: 'user_id and action are required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if requester is admin
    const admin = db.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(admin_id) as any
    if (!admin && admin_id) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (action === 'ban') {
      // Check if user exists
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id) as any
      if (!user) {
        return NextResponse.json(
          { data: null, error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if already banned
      const banned = db.prepare('SELECT user_id FROM banned_users WHERE user_id = ?').get(user_id) as any
      if (!banned) {
        db.prepare('INSERT INTO banned_users (user_id, reason, banned_by) VALUES (?, ?, ?)').run(
          user_id,
          reason || 'No reason provided',
          admin_id || null
        )
      }

      return NextResponse.json({ data: { success: true }, error: null })
    } else if (action === 'unban') {
      db.prepare('DELETE FROM banned_users WHERE user_id = ?').run(user_id)
      return NextResponse.json({ data: { success: true }, error: null })
    }

    return NextResponse.json(
      { data: null, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error managing ban:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
