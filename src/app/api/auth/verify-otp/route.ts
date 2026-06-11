import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { otpStore } from '@/lib/otp-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body as { phone: string; code: string }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Code OTP requis' },
        { status: 400 }
      )
    }

    const stored = otpStore.get(phone.trim())

    if (!stored) {
      return NextResponse.json(
        { success: false, message: 'Code OTP non trouvé ou expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      )
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(phone.trim())
      return NextResponse.json(
        { success: false, message: 'Code OTP expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      )
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, message: 'Code OTP incorrect' },
        { status: 401 }
      )
    }

    otpStore.delete(phone.trim())

    const user = await db.user.findUnique({
      where: { phone: phone.trim() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

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
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
