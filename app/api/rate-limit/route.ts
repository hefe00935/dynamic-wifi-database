import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const MAX_SUBMISSIONS_PER_DAY = 10

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ canSubmit: true, count: 0 })
    }

    const db = getDb()
    const limit = db.prepare('SELECT * FROM user_submission_limits WHERE user_id = ?').get(user_id) as any

    if (!limit) {
      return NextResponse.json({ canSubmit: true, count: 0 })
    }

    const resetTime = new Date(limit.reset_at)
    const now = new Date()

    if (resetTime < now) {
      // Reset count
      db.prepare(`
        UPDATE user_submission_limits 
        SET submission_count = 0, reset_at = datetime('now', '+1 day')
        WHERE user_id = ?
      `).run(user_id)
      return NextResponse.json({ canSubmit: true, count: 0 })
    }

    const canSubmit = limit.submission_count < MAX_SUBMISSIONS_PER_DAY

    return NextResponse.json({
      canSubmit,
      count: limit.submission_count,
      max: MAX_SUBMISSIONS_PER_DAY,
    })
  } catch (error: any) {
    console.error('Error checking rate limit:', error)
    return NextResponse.json({ canSubmit: true, count: 0 })
  }
}

