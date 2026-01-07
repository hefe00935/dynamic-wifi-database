import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, reason, user_id, reported_count } = body

    const db = getDb()

    // Ensure reports table exists
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='reports'
      `).get()

      if (!tableExists) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            wifi_id TEXT NOT NULL,
            user_id TEXT,
            reason TEXT,
            resolved INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (wifi_id) REFERENCES wifis(id)
          );
          CREATE INDEX IF NOT EXISTS idx_reports_wifi_id ON reports(wifi_id);
        `)
      }
    } catch (e) {
      console.error('Error checking/creating reports table:', e)
    }

    if (status && user_id) {
      // Check if user is admin before updating status
      const admin = db.prepare('SELECT * FROM admin_users WHERE user_id = ?').get(user_id) as any

      if (!admin) {
        return NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 403 }
        )
      }

      db.prepare('UPDATE wifis SET status = ? WHERE id = ?').run(status, id)
    }

    if (reason) {
      const reportId = crypto.randomUUID()
      db.prepare(
        'INSERT INTO reports (id, wifi_id, user_id, reason) VALUES (?, ?, ?, ?)'
      ).run(reportId, id, user_id || null, reason)
    }

    if (reported_count !== undefined) {
      db.prepare('UPDATE wifis SET reported_count = ?, last_reported_at = datetime("now") WHERE id = ?').run(reported_count, id)
    }

    const wifi = db.prepare('SELECT * FROM wifis WHERE id = ?').get(id)

    return NextResponse.json({ data: wifi, error: null })
  } catch (error: any) {
    console.error('Error updating wifi:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

