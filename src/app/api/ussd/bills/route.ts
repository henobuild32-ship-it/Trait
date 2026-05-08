import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, billType, reference, amount, currency } = body;

    if (!userId || !billType || !reference || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Tous les champs sont requis' }, { status: 400 });
    }

    const validTypes = ['electricity', 'water', 'internet', 'subscription', 'other'];
    if (!validTypes.includes(billType)) {
      return NextResponse.json({ success: false, message: 'Type de facture non valide' });
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

    const billPayment = await db.billPayment.create({
      data: {
        userId,
        billType,
        reference: reference.trim(),
        amount,
        currency: currency || 'USD',
        status: 'completed',
      },
    });

    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: amount } }
        : { realBalance: { decrement: amount } },
    });

    const typeLabels: Record<string, string> = {
      electricity: 'Électricité',
      water: 'Eau',
      internet: 'Internet',
      subscription: 'Abonnement',
      other: 'Autre',
    };

    await db.notification.create({
      data: {
        userId,
        title: 'Paiement de facture',
        message: `Paiement de ${amount.toFixed(2)} ${currency} pour ${typeLabels[billType] || billType} (Réf: ${reference})`,
        type: 'purchase',
      },
    });

    return NextResponse.json({
      success: true,
      billPayment: {
        id: billPayment.id,
        billType: billPayment.billType,
        reference: billPayment.reference,
        amount: billPayment.amount,
        currency: billPayment.currency,
        status: billPayment.status,
      },
    });
  } catch (error) {
    console.error('USSD bill payment error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
