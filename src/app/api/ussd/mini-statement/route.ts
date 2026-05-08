import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    // Get all transactions for mini statement (last 5)
    const sentTransactions = await db.transaction.findMany({
      where: { senderId: userId, status: 'completed' },
      include: { receiver: { select: { phone: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const receivedTransactions = await db.transaction.findMany({
      where: { receiverId: userId, status: 'completed' },
      include: { sender: { select: { phone: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const deposits = await db.deposit.findMany({
      where: { userId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const withdrawals = await db.withdrawal.findMany({
      where: { userId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const creditPurchases = await db.creditPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const billPayments = await db.billPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    type MiniItem = {
      type: string;
      amount: number;
      currency: string;
      date: string;
      detail: string;
    };

    const items: MiniItem[] = [
      ...sentTransactions.map(t => ({
        type: 'envoi',
        amount: t.amount,
        currency: t.currency,
        date: t.createdAt.toISOString(),
        detail: `→ ${t.receiver.phone}`,
      })),
      ...receivedTransactions.map(t => ({
        type: 'réception',
        amount: t.amount,
        currency: t.currency,
        date: t.createdAt.toISOString(),
        detail: `← ${t.sender.phone}`,
      })),
      ...deposits.map(d => ({
        type: 'dépôt',
        amount: d.amount,
        currency: d.currency,
        date: d.createdAt.toISOString(),
        detail: d.method,
      })),
      ...withdrawals.map(w => ({
        type: 'retrait',
        amount: w.amount,
        currency: w.currency,
        date: w.createdAt.toISOString(),
        detail: w.method,
      })),
      ...creditPurchases.map(c => ({
        type: 'crédit',
        amount: c.amount,
        currency: c.currency,
        date: c.createdAt.toISOString(),
        detail: `${c.network} - ${c.phoneNumber}`,
      })),
      ...billPayments.map(b => ({
        type: 'facture',
        amount: b.amount,
        currency: b.currency,
        date: b.createdAt.toISOString(),
        detail: `${b.billType} - ${b.reference}`,
      })),
    ];

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      miniStatement: items.slice(0, 5),
    });
  } catch (error) {
    console.error('USSD mini statement error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
