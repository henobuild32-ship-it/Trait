import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const typeToBillerName: Record<string, string> = {
  electricity: 'SNEL',
  water: 'REGIDESO',
  internet: 'Internet',
  subscription: 'École',
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const history = await prisma.billPayment.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    })

    const mappedHistory = history.map((item) => ({
      id: item.id,
      billerName: typeToBillerName[item.billType] || 'Facture',
      amount: item.amount,
      currency: item.currency,
      reference: item.reference,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, history: mappedHistory })
  } catch (error) {
    console.error('Bills history GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
