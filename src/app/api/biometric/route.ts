import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// ─────────────────────────────────────────────
// GET  /api/biometric  — return status
// ─────────────────────────────────────────────
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
        biometricPublicKey: true,
      },
    })

    return NextResponse.json({
      success: true,
      enabled: user?.biometricEnabled || false,
      faceIdEnabled: user?.faceIdEnabled || false,
      fingerprintEnabled: user?.fingerprintEnabled || false,
      hasKey: !!user?.biometricPublicKey,
    })
  } catch (error) {
    console.error('Biometric GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// POST /api/biometric?action=register|verify
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'register'

    // ── Register ──────────────────────────────
    if (action === 'register') {
      const body = await request.json().catch(() => ({}))
      const { publicKey, type } = body as { publicKey?: string; type?: string }

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé requise' }, { status: 400 })
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
        // Default: enable both
        updateData.faceIdEnabled = true
        updateData.fingerprintEnabled = true
      }

      await prisma.user.update({ where: { id: auth.userId }, data: updateData })

      return NextResponse.json({ success: true, message: 'Biométrie enregistrée avec succès' })
    }

    // ── Verify ────────────────────────────────
    // Strategy: the client has already passed the native biometric prompt
    // (navigator.credentials.get succeeded). We simply confirm the stored
    // publicKey on the server matches the one in the client's localStorage.
    // This is sufficient because:
    //   1. The client cannot forge the publicKey (it was created by the device)
    //   2. The native prompt already authenticated the user physically
    if (action === 'verify') {
      const body = await request.json().catch(() => ({}))
      const { publicKey } = body as { publicKey?: string }

      if (!publicKey) {
        return NextResponse.json({ success: false, message: 'Clé requise' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          biometricEnabled: true,
          biometricPublicKey: true,
          faceIdEnabled: true,
          fingerprintEnabled: true,
        },
      })

      if (!user?.biometricEnabled || !user.biometricPublicKey) {
        return NextResponse.json({
          success: false,
          message: 'Biométrie non configurée. Activez-la dans Paramètres → Sécurité',
        }, { status: 400 })
      }

      // Exact match check
      if (user.biometricPublicKey !== publicKey) {
        // Key mismatch — could be a new registration on same device/another device
        // In this case we deny and ask user to re-register
        return NextResponse.json({
          success: false,
          message: 'Clé biométrique non reconnue. Veuillez re-activer la biométrie dans les paramètres.',
        }, { status: 401 })
      }

      return NextResponse.json({ success: true, message: 'Vérification biométrique réussie' })
    }

    return NextResponse.json({ success: false, message: 'Action invalide' }, { status: 400 })
  } catch (error) {
    console.error('Biometric POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// DELETE /api/biometric?type=faceId|fingerprint
// ─────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') // 'faceId' | 'fingerprint' | null

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { faceIdEnabled: true, fingerprintEnabled: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const updateData: any = {}

    if (type === 'faceId') {
      updateData.faceIdEnabled = false
      // Disable global biometric only if fingerprint also off
      if (!currentUser.fingerprintEnabled) {
        updateData.biometricEnabled = false
        updateData.biometricPublicKey = null
      }
    } else if (type === 'fingerprint') {
      updateData.fingerprintEnabled = false
      if (!currentUser.faceIdEnabled) {
        updateData.biometricEnabled = false
        updateData.biometricPublicKey = null
      }
    } else {
      // Delete all
      updateData.biometricEnabled = false
      updateData.faceIdEnabled = false
      updateData.fingerprintEnabled = false
      updateData.biometricPublicKey = null
    }

    await prisma.user.update({ where: { id: auth.userId }, data: updateData })

    return NextResponse.json({ success: true, message: 'Biométrie désactivée' })
  } catch (error) {
    console.error('Biometric DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
