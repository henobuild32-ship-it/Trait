import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pin } = body as { userId: string; pin: string }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8 || !/^\d{4,8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: 'Le code PIN doit comporter entre 4 et 8 chiffres' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { pin },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Code PIN défini avec succès',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        pseudo: user.pseudo,
        country: user.country,
        role: user.role,
        agentCode: user.agentCode,
        realBalance: user.realBalance,
        bonusBalance: user.bonusBalance,
        pin: user.pin,
        isVerified: user.isVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    })
  } catch (error) {
    console.error('Set PIN error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
