import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: auth.userId },
      include: { contributions: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, goals })
  } catch (error) {
    console.error('Savings GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, targetAmount, currency, deadline, autoTransfer, autoAmount, autoFrequency } = body

    if (!name || !targetAmount || targetAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Nom et objectif de montant requis' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: auth.userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currency: currency || 'FC',
        deadline: deadline ? new Date(deadline) : null,
        autoTransfer: autoTransfer || false,
        autoAmount: autoAmount ? parseFloat(autoAmount) : null,
        autoFrequency: autoFrequency || null,
      },
    })

    return NextResponse.json({ success: true, goal }, { status: 201 })
  } catch (error) {
    console.error('Savings POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
