import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    
    // First check if reports table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='reports'
    `).get()

    if (!tableExists) {
      // Create reports table if it doesn't exist
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
    
    const reports = db.prepare(`
      SELECT * FROM reports
      ORDER BY created_at DESC
    `).all() as any[]
    
    return NextResponse.json({ data: reports, error: null })
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { report_id, resolved } = body

    if (!report_id) {
      return NextResponse.json(
        { data: null, error: 'report_id is required' },
        { status: 400 }
      )
    }

    const db = getDb()
    
    db.prepare('UPDATE reports SET resolved = ? WHERE id = ?').run(resolved ? 1 : 0, report_id)
    
    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error: any) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
