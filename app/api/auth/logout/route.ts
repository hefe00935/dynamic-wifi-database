import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Logout is handled on client side by clearing localStorage
    // Server just returns success
    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error: any) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
