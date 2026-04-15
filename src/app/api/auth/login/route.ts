import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, agentCode, password } = body as {
      phone?: string
      agentCode?: string
      password?: string
    }

    // Find user by phone or agent code
    let user
    if (phone) {
      if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Numéro de téléphone requis' },
          { status: 400 }
        )
      }
      user = await db.user.findUnique({
        where: { phone: phone.trim() },
      })
    } else if (agentCode) {
      if (!agentCode || typeof agentCode !== 'string' || agentCode.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Code agent requis" },
          { status: 400 }
        )
      }
      user = await db.user.findUnique({
        where: { agentCode: agentCode.trim() },
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone ou code agent requis' },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Demo mode: accept any non-empty password
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe requis' },
        { status: 400 }
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
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
