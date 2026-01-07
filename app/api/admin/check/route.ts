import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ isAdmin: false })
    }

    const db = getDb()
    const admin = db.prepare('SELECT * FROM admin_users WHERE user_id = ?').get(user_id)

    return NextResponse.json({ isAdmin: !!admin })
  } catch (error: any) {
    console.error('Error checking admin:', error)
    return NextResponse.json({ isAdmin: false })
  }
}

