import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    const withdrawals = await db.withdrawal.findMany({
      where: { status: 'pending', ...(agentId ? { agentId } : {}) },
      include: {
        user: { select: { name: true, pseudo: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      userName: w.user?.name || null,
      userPseudo: w.user?.pseudo || null,
      userPhone: w.user?.phone || '',
      amount: w.amount,
      fee: w.fee,
      currency: w.currency,
      method: w.method,
      status: w.status,
      createdAt: w.createdAt,
    }))

    return NextResponse.json({
      success: true,
      withdrawals: formatted,
    })
  } catch (error) {
    console.error('Pending withdrawals error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
