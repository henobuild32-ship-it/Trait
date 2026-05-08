import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch all transactions where user is sender or receiver
    const sentTransactions = await db.transaction.findMany({
      where: { senderId: userId },
      include: {
        sender: { select: { id: true, phone: true, name: true, pseudo: true } },
        receiver: { select: { id: true, phone: true, name: true, pseudo: true } },
      },
    })

    const receivedTransactions = await db.transaction.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { id: true, phone: true, name: true, pseudo: true } },
        receiver: { select: { id: true, phone: true, name: true, pseudo: true } },
      },
    })

    // Fetch deposits
    const deposits = await db.deposit.findMany({
      where: { userId },
    })

    // Fetch withdrawals
    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
    })

    // Map all items to a unified format
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

    const sentItems: HistoryItem[] = sentTransactions.map((t) => ({
      id: t.id,
      type: 'send',
      amount: t.amount,
      fee: t.fee,
      currency: t.currency,
      status: t.status,
      description: t.description || `Envoi de ${t.amount.toFixed(2)} ${t.currency} à ${t.receiver.phone}`,
      createdAt: t.createdAt,
      counterparty: t.receiver ? { id: t.receiver.id, phone: t.receiver.phone, name: t.receiver.name, pseudo: t.receiver.pseudo } : null,
    }))

    const receivedItems: HistoryItem[] = receivedTransactions.map((t) => ({
      id: t.id,
      type: 'receive',
      amount: t.amount,
      fee: 0,
      currency: t.currency,
      status: t.status,
      description: t.description || `Réception de ${t.amount.toFixed(2)} ${t.currency} de ${t.sender.phone}`,
      createdAt: t.createdAt,
      counterparty: t.sender ? { id: t.sender.id, phone: t.sender.phone, name: t.sender.name, pseudo: t.sender.pseudo } : null,
    }))

    const depositItems: HistoryItem[] = deposits.map((d) => ({
      id: d.id,
      type: 'deposit',
      amount: d.amount,
      fee: 0,
      currency: d.currency,
      status: d.status,
      description: `Dépôt via ${d.method}`,
      createdAt: d.createdAt,
    }))

    const withdrawalItems: HistoryItem[] = withdrawals.map((w) => ({
      id: w.id,
      type: 'withdrawal',
      amount: w.amount,
      fee: w.fee,
      currency: w.currency,
      status: w.status,
      description: `Retrait via ${w.method}`,
      createdAt: w.createdAt,
    }))

    // Merge and sort by date (most recent first)
    const history = [...sentItems, ...receivedItems, ...depositItems, ...withdrawalItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      history,
    })
  } catch (error) {
    console.error('Transfer history error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
