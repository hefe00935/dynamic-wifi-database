import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { data: null, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { data: null, error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { data: null, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any
    if (existingUser) {
      return NextResponse.json(
        { data: null, error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const userId = crypto.randomUUID()
    const passwordHash = hashPassword(password)
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, passwordHash, now, now)

    // Create submission limit record
    db.prepare(`
      INSERT INTO user_submission_limits (user_id, submission_count, last_submission_at, reset_at)
      VALUES (?, 0, ?, datetime('now', '+1 day'))
    `).run(userId, now)

    return NextResponse.json({ data: { userId }, error: null })
  } catch (error: any) {
    console.error('Error signing up:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
