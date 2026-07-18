import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const rewards = await prisma.referralReward.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, rewards })
  } catch (error) {
    console.error('Referral rewards GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
