import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const type = searchParams.get('type') || 'all'
    const cursor = searchParams.get('cursor')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    const skip = cursor ? 1 : (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE + 1

    type HistoryItem = {
      id: string
      type: string
      amount: number
      fee: number
      currency: string
      status: string
      description: string
      createdAt: Date
      counterparty?: { id: string; phone: string; name: string | null; pseudo: string | null } | null
    }

    const userInclude = { select: { id: true, phone: true, name: true, pseudo: true } }
    const orderBy = { createdAt: 'desc' as const }

    const cursorFilter = cursor ? { createdAt: { lt: new Date(cursor) } } : {}

    const sentTransactions = await db.transaction.findMany({
      where: { senderId: userId, ...cursorFilter },
      include: { sender: userInclude, receiver: userInclude },
      orderBy,
      take,
      skip,
    })

    const receivedTransactions = await db.transaction.findMany({
      where: { receiverId: userId, ...cursorFilter },
      include: { sender: userInclude, receiver: userInclude },
      orderBy,
      take,
      skip,
    })

    const deposits = await db.deposit.findMany({
      where: { userId, ...cursorFilter },
      orderBy,
      take,
      skip,
    })

    const withdrawals = await db.withdrawal.findMany({
      where: { userId, ...cursorFilter },
      orderBy,
      take,
      skip,
    })

    const sentItems: HistoryItem[] = sentTransactions.map((t) => ({
      id: t.id, type: 'send', amount: t.amount, fee: t.fee, currency: t.currency,
      status: t.status, description: t.description || `Envoi de ${t.amount.toFixed(2)} ${t.currency} à ${t.receiver?.phone || 'inconnu'}`,
      createdAt: t.createdAt, counterparty: t.receiver,
    }))

    const receivedItems: HistoryItem[] = receivedTransactions.map((t) => ({
      id: t.id, type: 'receive', amount: t.amount, fee: 0, currency: t.currency,
      status: t.status, description: t.description || `Réception de ${t.amount.toFixed(2)} ${t.currency} de ${t.sender?.phone || 'inconnu'}`,
      createdAt: t.createdAt, counterparty: t.sender,
    }))

    const depositItems: HistoryItem[] = deposits.map((d) => ({
      id: d.id, type: 'deposit', amount: d.amount, fee: 0, currency: d.currency,
      status: d.status, description: `Dépôt via ${d.method}`, createdAt: d.createdAt,
    }))

    const withdrawalItems: HistoryItem[] = withdrawals.map((w) => ({
      id: w.id, type: 'withdrawal', amount: w.amount, fee: w.fee, currency: w.currency,
      status: w.status, description: `Retrait via ${w.method}`, createdAt: w.createdAt,
    }))

    let allItems = [...sentItems, ...receivedItems, ...depositItems, ...withdrawalItems]

    if (type !== 'all') {
      allItems = allItems.filter((item) => item.type === type)
    }

    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const hasMore = allItems.length > PAGE_SIZE
    const history = allItems.slice(0, PAGE_SIZE)
    const nextCursor = hasMore ? history[history.length - 1]?.createdAt.toISOString() : null

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        hasMore,
        nextCursor,
      },
    })
  } catch (error) {
    console.error('Transfer history error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
