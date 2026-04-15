import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body as { phone: string; code: string }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'OTP code is required' },
        { status: 400 }
      )
    }

    // Demo mode: accept any code
    const user = await db.user.findUnique({
      where: { phone: phone.trim() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found. Please request an OTP first.' },
        { status: 404 }
      )
    }

    // Mark user as verified
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        pseudo: updatedUser.pseudo,
        country: updatedUser.country,
        realBalance: updatedUser.realBalance,
        bonusBalance: updatedUser.bonusBalance,
        isVerified: updatedUser.isVerified,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
