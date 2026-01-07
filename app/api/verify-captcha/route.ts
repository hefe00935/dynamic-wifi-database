import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 400 })
    }

    const secretKey = process.env.HCAPTCHA_SECRET_KEY

    if (!secretKey) {
      // If hCaptcha is not configured, allow the request (for development)
      console.warn('HCAPTCHA_SECRET_KEY not set, skipping verification')
      return NextResponse.json({ success: true })
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    if (data.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying captcha:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

