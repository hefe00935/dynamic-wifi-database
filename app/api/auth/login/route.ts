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

    const db = getDb()

    // Find user
    const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username) as any

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordHash = hashPassword(password)
    if (user.password_hash !== passwordHash) {
      return NextResponse.json(
        { data: null, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({ data: { userId: user.id }, error: null })
  } catch (error: any) {
    console.error('Error logging in:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
