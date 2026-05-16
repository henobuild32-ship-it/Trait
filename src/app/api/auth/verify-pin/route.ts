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

    if (user.pin !== pin) {
      return NextResponse.json(
        { success: false, message: 'Code PIN incorrect' },
        { status: 401 }
      )
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
