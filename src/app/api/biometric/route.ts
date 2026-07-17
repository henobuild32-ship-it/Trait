import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'register'

    if (action === 'register') {
      const body = await request.json()
      const { publicKey } = body

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé publique requise' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: auth.id },
        data: {
          biometricEnabled: true,
          biometricPublicKey: publicKey,
        },
      })

      return NextResponse.json({ success: true, message: 'Données biométriques enregistrées avec succès' })
    }

    if (action === 'verify') {
      const body = await request.json()
      const { publicKey } = body

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé publique requise' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { biometricPublicKey: true, biometricEnabled: true },
      })

      if (!user || !user.biometricEnabled || !user.biometricPublicKey) {
        return NextResponse.json({ success: false, message: 'Données biométriques non configurées' }, { status: 400 })
      }

      if (user.biometricPublicKey !== publicKey) {
        return NextResponse.json({ success: false, message: 'Vérification biométrique échouée' }, { status: 401 })
      }

      return NextResponse.json({ success: true, message: 'Vérification biométrique réussie' })
    }

    return NextResponse.json({ success: false, message: 'Action invalide. Utilisez register ou verify' }, { status: 400 })
  } catch (error) {
    console.error('Biometric POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: auth.id },
      data: {
        biometricEnabled: false,
        biometricPublicKey: null,
      },
    })

    return NextResponse.json({ success: true, message: 'Données biométriques désactivées' })
  } catch (error) {
    console.error('Biometric DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
