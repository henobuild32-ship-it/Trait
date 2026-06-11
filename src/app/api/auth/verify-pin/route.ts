import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAndMigratePin, requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { userId, pin } = body as { userId: string; pin: string }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8 || !/^\d{4,8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: 'Code PIN invalide' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    if (!user.pin) {
      return NextResponse.json(
        { success: false, message: 'Aucun code PIN défini. Veuillez en créer un dans les paramètres.' },
        { status: 400 }
      )
    }

    const isValid = await verifyAndMigratePin(user.id, pin, user.pin)

    if (!isValid) {
      // Increment pinAttempts for lockout
      await db.user.update({
        where: { id: userId },
        data: { pinAttempts: { increment: 1 } },
      })

      // Check if should lock
      if (user.pinAttempts >= 4) {
        await db.user.update({
          where: { id: userId },
          data: { tempBlocked: true, pinAttempts: 0 },
        })
        return NextResponse.json(
          { success: false, message: 'Trop de tentatives. Votre compte est temporairement bloqué.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { success: false, message: 'Code PIN incorrect' },
        { status: 401 }
      )
    }

    // Reset pin attempts on success
    if (user.pinAttempts > 0) {
      await db.user.update({
        where: { id: userId },
        data: { pinAttempts: 0 },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Code PIN vérifié',
    })
  } catch (error) {
    console.error('Verify PIN error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
