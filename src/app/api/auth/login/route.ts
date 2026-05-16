import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body as {
      phone?: string
      password?: string
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { phone: phone.trim() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Numéro ou mot de passe incorrect' },
        { status: 404 }
      )
    }

    // Verify password
    if (!user.password || user.password !== password.trim()) {
      return NextResponse.json(
        { success: false, message: 'Numéro ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Check if suspended
    if (user.suspended) {
      return NextResponse.json(
        { success: false, message: `Compte suspendu. Motif: ${user.suspensionReason || 'Contactez le support'}` },
        { status: 403 }
      )
    }

    // Check if temporarily blocked
    if (user.tempBlocked) {
      return NextResponse.json(
        { success: false, message: 'Votre compte est temporairement bloqué. Contactez le support TRAIT.' },
        { status: 403 }
      )
    }

    // Check agent validation status
    if (user.role === 'agent') {
      if (user.validationStatus === 'pending') {
        return NextResponse.json(
          {
            success: false,
            message: 'Votre compte Agent est en attente de validation par l\'administrateur TRAIT.',
            validationStatus: 'pending',
          },
          { status: 403 }
        )
      }

      if (user.validationStatus === 'rejected') {
        return NextResponse.json(
          {
            success: false,
            message: 'Votre demande de compte Agent a été refusée. Motif: ' + (user.validationRejectReason || 'Non spécifié'),
            validationStatus: 'rejected',
          },
          { status: 403 }
        )
      }

      if (user.suspended || user.validationStatus === 'suspended') {
        return NextResponse.json(
          {
            success: false,
            message: 'Votre compte Agent a été suspendu. Motif: ' + (user.suspensionReason || 'Contactez le support TRAIT.'),
            validationStatus: 'suspended',
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        pseudo: user.pseudo,
        email: user.email,
        gender: user.gender,
        city: user.city,
        country: user.country,
        role: user.role,
        agentCode: user.agentCode,
        agentNumber: user.agentNumber,
        validationStatus: user.validationStatus,
        validationRejectReason: user.validationRejectReason,
        realBalance: user.realBalance,
        realBalanceFC: user.realBalanceFC,
        bonusBalance: user.bonusBalance,
        bonusBalanceFC: user.bonusBalanceFC,
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
