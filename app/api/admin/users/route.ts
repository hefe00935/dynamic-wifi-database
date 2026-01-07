import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    
    const users = db.prepare(`
      SELECT u.id, u.username, 
             CASE WHEN a.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
      FROM users u
      LEFT JOIN admin_users a ON u.id = a.user_id
      ORDER BY u.created_at DESC
    `).all() as any[]
    
    return NextResponse.json({ data: users, error: null })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, action } = body

    if (!user_id || !action) {
      return NextResponse.json(
        { data: null, error: 'user_id and action are required' },
        { status: 400 }
      )
    }

    const db = getDb()

    if (action === 'make_admin') {
      // Check if user exists
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id) as any
      if (!user) {
        return NextResponse.json(
          { data: null, error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if already admin
      const admin = db.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(user_id) as any
      if (!admin) {
        db.prepare('INSERT INTO admin_users (user_id) VALUES (?)').run(user_id)
      }

      return NextResponse.json({ data: { success: true }, error: null })
    }

    return NextResponse.json(
      { data: null, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error managing user:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
