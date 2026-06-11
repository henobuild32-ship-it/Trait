import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { otpStore } from '@/lib/otp-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body as { phone: string }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 5 * 60 * 1000

    otpStore.set(phone.trim(), { code, expires })

    await db.user.upsert({
      where: { phone: phone.trim() },
      update: {},
      create: {
        phone: phone.trim(),
        bonusBalance: 10,
        realBalance: 0,
        country: 'CD',
      },
    })

    // TODO: Replace with actual SMS sending in production
    console.log(`[OTP] Code for ${phone.trim()}: ${code}`)

    return NextResponse.json({
      success: true,
      message: 'Code OTP envoyé',
      ...(process.env.NODE_ENV === 'development' ? { demoOtp: code } : {}),
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
