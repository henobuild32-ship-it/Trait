import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        biometricEnabled: true,
        faceIdEnabled: true,
        fingerprintEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      enabled: user?.biometricEnabled || false,
      faceIdEnabled: user?.faceIdEnabled || false,
      fingerprintEnabled: user?.fingerprintEnabled || false,
    })
  } catch (error) {
    console.error('Biometric GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'register'

    if (action === 'register') {
      const body = await request.json().catch(() => ({}))
      const { publicKey, type } = body

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé publique requise' }, { status: 400 })
      }

      const updateData: any = {
        biometricEnabled: true,
        biometricPublicKey: publicKey,
      }

      if (type === 'faceId') {
        updateData.faceIdEnabled = true
      } else if (type === 'fingerprint') {
        updateData.fingerprintEnabled = true
      } else {
        // Default to both if not specified
        updateData.faceIdEnabled = true
        updateData.fingerprintEnabled = true
      }

      await prisma.user.update({
        where: { id: auth.userId },
        data: updateData,
      })

      return NextResponse.json({ success: true, message: 'Données biométriques enregistrées avec succès' })
    }

    if (action === 'verify') {
      const body = await request.json().catch(() => ({}))
      const { publicKey } = body

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé publique requise' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
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

    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { faceIdEnabled: true, fingerprintEnabled: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const updateData: any = {}

    if (type === 'faceId') {
      updateData.faceIdEnabled = false
      if (!user.fingerprintEnabled) {
        updateData.biometricEnabled = false
        updateData.biometricPublicKey = null
      }
    } else if (type === 'fingerprint') {
      updateData.fingerprintEnabled = false
      if (!user.faceIdEnabled) {
        updateData.biometricEnabled = false
        updateData.biometricPublicKey = null
      }
    } else {
      updateData.biometricEnabled = false
      updateData.faceIdEnabled = false
      updateData.fingerprintEnabled = false
      updateData.biometricPublicKey = null
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Données biométriques mises à jour avec succès' })
  } catch (error) {
    console.error('Biometric DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
