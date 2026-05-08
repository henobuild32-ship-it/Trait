import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, network, phoneNumber, amount, currency } = body;

    if (!userId || !network || !phoneNumber || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Tous les champs sont requis' }, { status: 400 });
    }

    const validNetworks = ['Vodacom', 'Airtel', 'Orange', 'Africell'];
    if (!validNetworks.includes(network)) {
      return NextResponse.json({ success: false, message: 'Réseau non valide' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' });
    }

    const isFC = currency === 'FC';
    const realBal = isFC ? user.realBalanceFC : user.realBalance;

    if (realBal < amount) {
      return NextResponse.json({ success: false, message: `Solde insuffisant. Solde: ${realBal.toFixed(2)} ${currency}` });
    }

    // Create credit purchase
    const credit = await db.creditPurchase.create({
      data: {
        userId,
        network,
        phoneNumber: phoneNumber.trim(),
        amount,
        currency: currency || 'USD',
        status: 'completed',
      },
    });

    // Deduct from user
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: amount } }
        : { realBalance: { decrement: amount } },
    });

    await db.notification.create({
      data: {
        userId,
        title: 'Achat de crédit',
        message: `Achat de ${amount.toFixed(2)} ${currency} de crédit ${network} pour ${phoneNumber}`,
        type: 'purchase',
      },
    });

    return NextResponse.json({
      success: true,
      creditPurchase: {
        id: credit.id,
        network: credit.network,
        phoneNumber: credit.phoneNumber,
        amount: credit.amount,
        currency: credit.currency,
        status: credit.status,
      },
    });
  } catch (error) {
    console.error('USSD credit purchase error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
