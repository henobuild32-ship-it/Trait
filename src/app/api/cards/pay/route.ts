import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Card payment
export async function POST(request: NextRequest) {
  try {
    const { userId, cardId, amount, currency, description, pin } = await request.json() as {
      userId: string;
      cardId: string;
      amount: number;
      currency: string;
      description?: string;
      pin?: string;
    };

    if (!userId || !cardId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: userId, cardId, montant positif requis' },
        { status: 400 }
      );
    }

    if (!currency || !['USD', 'FC'].includes(currency)) {
      return NextResponse.json(
        { success: false, message: 'currency doit être "USD" ou "FC"' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.suspended) {
      return NextResponse.json(
        { success: false, message: 'Votre compte est suspendu' },
        { status: 403 }
      );
    }

    if (user.tempBlocked) {
      return NextResponse.json(
        { success: false, message: 'Votre compte est temporairement bloqué' },
        { status: 403 }
      );
    }

    // Verify card exists, is active, and belongs to user
    const card = await db.traitCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Carte non trouvée' },
        { status: 404 }
      );
    }

    if (card.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Cette carte ne vous appartient pas' },
        { status: 403 }
      );
    }

    if (card.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Cette carte est ${card.status}. Seules les cartes actives peuvent être utilisées.` },
        { status: 400 }
      );
    }

    // Verify currency matches card type
    if (card.cardType !== currency) {
      return NextResponse.json(
        { success: false, message: `Cette carte est de type ${card.cardType}, mais vous essayez de payer en ${currency}` },
        { status: 400 }
      );
    }

    // Verify user has sufficient balance
    const isFC = currency === 'FC';
    const realBal = isFC ? user.realBalanceFC : user.realBalance;

    const isChild = user.parentId !== null;

    if (isChild) {
      if (!pin) {
        return NextResponse.json(
          { success: false, message: "Le code PIN est obligatoire pour valider l'achat." },
          { status: 400 }
        );
      }
      if (user.pin !== pin) {
        return NextResponse.json(
          { success: false, message: "Code PIN de l'enfant incorrect." },
          { status: 400 }
        );
      }
    }

    const fee = isChild ? Math.round(amount * 0.007 * 100) / 100 : 0;
    const totalDeduction = amount + fee;

    if (realBal < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Solde réel: ${realBal.toFixed(2)} ${currency}, requis: ${totalDeduction.toFixed(2)} ${currency} (dont commission parrainage: ${fee} ${currency})`,
        },
        { status: 400 }
      );
    }

    // Deduct from user balance
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: totalDeduction } }
        : { realBalance: { decrement: totalDeduction } },
    });

    const paymentDesc = description || `Paiement par carte ${card.cardNumber}${isChild ? ` (Commission Enfant: ${fee} ${currency})` : ''}`;

    // Create CardPayment record
    const cardPayment = await db.cardPayment.create({
      data: {
        cardId,
        userId,
        amount,
        currency,
        description: paymentDesc,
        status: 'completed',
      },
    });

    // Create Transaction record for the payment
    const transaction = await db.transaction.create({
      data: {
        type: 'card_payment',
        amount,
        fee,
        currency,
        status: 'completed',
        senderId: userId,
        receiverId: userId,
        description: description || `Paiement par carte TRAIT - ${card.cardNumber.slice(-4)}${isChild ? ` (Commission Enfant: ${fee} ${currency})` : ''}`,
      },
    });

    // Create notification for the user
    await db.notification.create({
      data: {
        userId,
        title: 'Paiement par carte effectué',
        message: `Paiement de ${amount.toFixed(2)} ${currency} effectué avec votre carte TRAIT se terminant par ${card.cardNumber.slice(-4)}.`,
        type: 'card_payment',
      },
    });

    // Get updated user balance
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        realBalance: true,
        realBalanceFC: true,
        bonusBalance: true,
        bonusBalanceFC: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Paiement effectué avec succès',
      payment: {
        id: cardPayment.id,
        amount: cardPayment.amount,
        currency: cardPayment.currency,
        description: cardPayment.description,
        status: cardPayment.status,
        createdAt: cardPayment.createdAt,
      },
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      updatedBalances: updatedUser,
    });
  } catch (error) {
    console.error('Card payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
