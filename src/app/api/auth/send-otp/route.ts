import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body as { phone: string }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Upsert user: create if doesn't exist, with default bonusBalance of 10
    await db.user.upsert({
      where: { phone: phone.trim() },
      update: {},
      create: {
        phone: phone.trim(),
        bonusBalance: 10,
        realBalance: 0,
        country: 'US',
      },
    })

    // Demo mode: always return success, OTP code is "1234"
    return NextResponse.json({
      success: true,
      message: 'OTP sent',
      demoOtp: '1234',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
