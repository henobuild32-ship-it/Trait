import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: "L'ID de l'agent est requis" },
        { status: 400 }
      )
    }

    type ActivityItem = {
      id: string
      type: string
      amount: number
      fee: number
      currency: string
      status: string
      clientName: string | null
      clientPhone: string
      createdAt: Date
    }

    // Fetch agent deposits with client info
    const deposits = await db.deposit.findMany({
      where: { agentId },
      include: {
        user: { select: { name: true, pseudo: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch agent withdrawals with client info
    const withdrawals = await db.withdrawal.findMany({
      where: { agentId },
      include: {
        user: { select: { name: true, pseudo: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const depositItems: ActivityItem[] = deposits.map((d) => ({
      id: d.id,
      type: 'deposit',
      amount: d.amount,
      fee: 0,
      currency: d.currency,
      status: d.status,
      clientName: d.user?.name || d.user?.pseudo || null,
      clientPhone: d.user?.phone || '',
      createdAt: d.createdAt,
    }))

    const withdrawalItems: ActivityItem[] = withdrawals.map((w) => ({
      id: w.id,
      type: 'withdrawal',
      amount: w.amount,
      fee: w.fee,
      currency: w.currency,
      status: w.status,
      clientName: w.user?.name || w.user?.pseudo || null,
      clientPhone: w.user?.phone || '',
      createdAt: w.createdAt,
    }))

    // Merge and sort by date (most recent first)
    const activity = [...depositItems, ...withdrawalItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    console.error('Agent activity error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
