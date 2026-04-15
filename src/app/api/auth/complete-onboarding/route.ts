import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body as { userId?: string }

    // If userId is provided, update that user
    if (userId) {
      const user = await db.user.update({
        where: { id: userId },
        data: { hasCompletedOnboarding: true },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
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
    }

    // Otherwise just return success (for cases where user completes onboarding
    // but we handle state client-side)
    return NextResponse.json({
      success: true,
      message: 'Onboarding terminé',
    })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
