import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { userId } = body as { userId?: string }

    const targetUserId = userId || auth.userId

    // Ensure user can only complete their own onboarding
    if (auth.userId !== targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    const user = await db.user.update({
      where: { id: targetUserId },
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
        isVerified: user.isVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
