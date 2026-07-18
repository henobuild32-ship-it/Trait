import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function categorizeSpending(description: string | null): string {
  if (!description) return 'general'
  const d = description.toLowerCase()
  if (d.includes('transfert') || d.includes('send') || d.includes('transfer')) return 'transfers'
  if (d.includes('airtime') || d.includes('crédit') || d.includes('credit') || d.includes('orange') || d.includes('airtel') || d.includes('africell')) return 'airtime'
  if (d.includes('data') || d.includes('internet') || d.includes('mobile data')) return 'data'
  if (d.includes('dépot') || d.includes('deposit')) return 'deposits'
  if (d.includes('retrait') || d.includes('withdrawal')) return 'withdrawals'
  if (d.includes('paiement') || d.includes('payment') || d.includes('pay')) return 'payments'
  if (d.includes('facture') || d.includes('bill') || d.includes('snel') || d.includes('regideso')) return 'bills'
  if (d.includes('épargne') || d.includes('saving') || d.includes('goal')) return 'savings'
  if (d.includes('bundle') || d.includes('achat') || d.includes('purchase')) return 'purchases'
  return 'general'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const userId = auth.userId

    const [sentThisMonth, receivedThisMonth, allTransactions, topReceivers, dailyCounts, balanceHistory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { senderId: userId, createdAt: { gte: startOfMonth }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { receiverId: userId, createdAt: { gte: startOfMonth }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'completed',
        },
        select: { amount: true, description: true, senderId: true, receiverId: true },
      }),
      prisma.transaction.groupBy({
        by: ['receiverId'],
        where: { senderId: userId, status: 'completed' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "Transaction"
        WHERE (sender_id = ${userId} OR receiver_id = ${userId})
          AND created_at >= ${thirtyDaysAgo}
          AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.transaction.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'completed',
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'asc' },
        select: { amount: true, createdAt: true, senderId: true, receiverId: true, type: true },
      }),
    ])

    const topRecipientIds = topReceivers.map((r) => r.receiverId)
    const topRecipientUsers = topRecipientIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topRecipientIds } },
          select: { id: true, phone: true, name: true, pseudo: true },
        })
      : []

    const top5 = topReceivers.map((r) => {
      const user = topRecipientUsers.find((u) => u.id === r.receiverId)
      return {
        id: r.receiverId,
        phone: user?.phone || 'Inconnu',
        name: user?.name || null,
        totalSent: r._sum.amount || 0,
      }
    })

    const spendingByCategory: Record<string, number> = {}
    for (const t of allTransactions) {
      if (t.senderId === userId) {
        const cat = categorizeSpending(t.description)
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + t.amount
      }
    }

    let runningBalance = 0
    const balancePoints = balanceHistory.map((t: any) => {
      if (t.senderId === userId) runningBalance -= t.amount
      if (t.receiverId === userId) runningBalance += t.amount
      return { date: t.createdAt, balance: runningBalance }
    })

    const dailyTx = Array.isArray(dailyCounts)
      ? dailyCounts.map((d: any) => ({
          date: d.date,
          count: Number(d.count),
        }))
      : []

    return NextResponse.json({
      success: true,
      analytics: {
        totalSentThisMonth: sentThisMonth._sum.amount || 0,
        totalReceivedThisMonth: receivedThisMonth._sum.amount || 0,
        spendingByCategory,
        topRecipients: top5,
        dailyTransactions: dailyTx,
        balanceHistory: balancePoints,
      },
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
