import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { success: false, message: 'parentId est requis' },
        { status: 400 }
      );
    }

    // Fetch children
    const children = await db.user.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        pseudo: true,
        phone: true,
        realBalance: true,
        realBalanceFC: true,
        suspended: true,
        createdAt: true,
        cards: {
          select: {
            id: true,
            cardType: true,
            cardNumber: true,
            cvv: true,
            qrCode: true,
            expiryDate: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const childrenIds = children.map((c) => c.id);

    // Fetch recharge history (transactions sent by parent to children)
    const recharges = await db.transaction.findMany({
      where: {
        senderId: parentId,
        type: 'child_recharge',
      },
      include: {
        receiver: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch children expenses (payments made by children)
    const expenses = childrenIds.length > 0
      ? await db.transaction.findMany({
          where: {
            senderId: { in: childrenIds },
            type: { in: ['card_payment', 'qr_payment'] },
          },
          include: {
            sender: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : [];

    return NextResponse.json({
      success: true,
      children,
      recharges,
      expenses,
    });
  } catch (error) {
    console.error('List child accounts error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des comptes enfants' },
      { status: 500 }
    );
  }
}
