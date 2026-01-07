import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { data: null, error: 'user_id is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id) as any
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already admin
    const existingAdmin = db.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(user_id) as any
    if (existingAdmin) {
      return NextResponse.json(
        { data: { success: true, message: 'User is already admin' }, error: null }
      )
    }

    // Add to admin_users table
    db.prepare('INSERT INTO admin_users (user_id) VALUES (?)').run(user_id)

    return NextResponse.json({
      data: { success: true, message: 'User made admin successfully' },
      error: null,
    })
  } catch (error: any) {
    console.error('Error making user admin:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
