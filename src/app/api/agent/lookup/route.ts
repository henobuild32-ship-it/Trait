import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Le numéro de téléphone est requis' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { phone: phone.trim() },
      select: {
        id: true,
        name: true,
        pseudo: true,
        phone: true,
        realBalance: true,
        bonusBalance: true,
        isVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'Aucun client trouvé avec ce numéro' })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Agent lookup error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
