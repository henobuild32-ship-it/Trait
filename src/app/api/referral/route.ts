import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { referralCode: true },
    })

    if (!user || !user.referralCode) {
      return NextResponse.json({
        success: true,
        stats: {
          code: null,
          totalReferrals: 0,
          totalRewards: 0,
          pendingRewards: 0,
        },
      })
    }

    const rewards = await prisma.referralReward.findMany({
      where: { userId: auth.userId },
    })

    const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0)
    const pendingRewards = rewards
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0)

    const referredUsers = await prisma.user.count({
      where: { referredBy: user.referralCode },
    })

    return NextResponse.json({
      success: true,
      stats: {
        code: user.referralCode,
        totalReferrals: referredUsers,
        totalRewards,
        pendingRewards,
      },
    })
  } catch (error) {
    console.error('Referral GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (user.referralCode) {
      return NextResponse.json({ success: true, code: user.referralCode, message: 'Code de parrainage déjà existant' })
    }

    let code: string
    let exists = true
    do {
      code = crypto.randomBytes(4).toString('hex').toUpperCase()
      const existing = await prisma.user.findUnique({ where: { referralCode: code } })
      exists = !!existing
    } while (exists)

    await prisma.user.update({
      where: { id: auth.userId },
      data: { referralCode: code },
    })

    return NextResponse.json({ success: true, code }, { status: 201 })
  } catch (error) {
    console.error('Referral POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
