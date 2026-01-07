import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { WiFi } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'approved'
    const filter = searchParams.get('filter') || 'all'

    const db = getDb()
    
    let query = 'SELECT * FROM wifis'
    const params: any[] = []

    if (filter !== 'all') {
      query += ' WHERE status = ?'
      params.push(filter)
    } else if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'

    const wifis = db.prepare(query).all(...params) as WiFi[]

    return NextResponse.json({ data: wifis, error: null })
  } catch (error: any) {
    console.error('Error fetching wifis:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password, latitude, longitude, user_id } = body

    if (!name || !password || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { data: null, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = getDb()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO wifis (id, name, password, latitude, longitude, status, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(id, name, password, latitude, longitude, user_id || null, now, now)

    // Update submission limits
    if (user_id) {
      const limit = db.prepare('SELECT * FROM user_submission_limits WHERE user_id = ?').get(user_id) as any
      
      if (limit) {
        const resetTime = new Date(limit.reset_at)
        const now = new Date()
        
        if (resetTime < now) {
          // Reset count
          db.prepare(`
            UPDATE user_submission_limits 
            SET submission_count = 1, last_submission_at = ?, reset_at = datetime('now', '+1 day')
            WHERE user_id = ?
          `).run(new Date().toISOString(), user_id)
        } else {
          // Increment count
          db.prepare(`
            UPDATE user_submission_limits 
            SET submission_count = submission_count + 1, last_submission_at = ?
            WHERE user_id = ?
          `).run(new Date().toISOString(), user_id)
        }
      } else {
        db.prepare(`
          INSERT INTO user_submission_limits (user_id, submission_count, last_submission_at, reset_at)
          VALUES (?, 1, ?, datetime('now', '+1 day'))
        `).run(user_id, new Date().toISOString())
      }
    }

    return NextResponse.json({ data: { id }, error: null })
  } catch (error: any) {
    console.error('Error creating wifi:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

