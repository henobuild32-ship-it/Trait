import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, childId, amount, currency, pinOrPassword } = body as {
      parentId: string;
      childId: string;
      amount: number;
      currency: 'USD' | 'FC';
      pinOrPassword?: string;
    };

    if (!parentId || !childId || !amount || amount <= 0 || !currency) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      );
    }

    if (!pinOrPassword) {
      return NextResponse.json(
        { success: false, message: 'PIN ou mot de passe de confirmation requis' },
        { status: 400 }
      );
    }

    // Verify parent
    const parent = await db.user.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, message: 'Parent non trouvé' },
        { status: 404 }
      );
    }

    // Authenticate parent (accept PIN or Password)
    const isAuthentic = 
      parent.pin === pinOrPassword || 
      parent.password === pinOrPassword;

    if (!isAuthentic) {
      return NextResponse.json(
        { success: false, message: 'PIN ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Verify child
    const child = await db.user.findUnique({
      where: { id: childId },
    });

    if (!child || child.parentId !== parentId) {
      return NextResponse.json(
        { success: false, message: 'Compte enfant non trouvé ou non lié à ce parent' },
        { status: 404 }
      );
    }

    const isFC = currency === 'FC';
    const limitMax = isFC ? 10000000 : 1000;
    const currentChildBal = isFC ? child.realBalanceFC : child.realBalance;

    // Enforce child balance limits
    if (currentChildBal + amount > limitMax) {
      return NextResponse.json(
        {
          success: false,
          message: `Dépassement de la limite autorisé pour ce compte enfant. Solde max : ${limitMax.toLocaleString('fr-FR')} ${currency}. Solde actuel: ${currentChildBal.toFixed(2)} ${currency}.`,
        },
        { status: 400 }
      );
    }

    // Check parent balance
    const currentParentBal = isFC ? parent.realBalanceFC : parent.realBalance;
    if (currentParentBal < amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde du parent insuffisant. Requis: ${amount.toFixed(2)} ${currency}, Disponible: ${currentParentBal.toFixed(2)} ${currency}.`,
        },
        { status: 400 }
      );
    }

    // Perform transaction
    const [updatedParent, updatedChild, transaction] = await db.$transaction([
      // Deduct parent
      db.user.update({
        where: { id: parentId },
        data: isFC
          ? { realBalanceFC: { decrement: amount } }
          : { realBalance: { decrement: amount } },
      }),
      // Credit child
      db.user.update({
        where: { id: childId },
        data: isFC
          ? { realBalanceFC: { increment: amount } }
          : { realBalance: { increment: amount } },
      }),
      // Log transaction
      db.transaction.create({
        data: {
          type: 'child_recharge',
          amount,
          fee: 0,
          currency,
          status: 'completed',
          senderId: parentId,
          receiverId: childId,
          description: `Recharge de la carte de ${child.name || 'enfant'}`,
        },
      }),
    ]);

    // Log the recharge activity
    await logSecurityEvent({
      userId: parentId,
      action: 'child_card_recharged',
      details: JSON.stringify({
        childId,
        childName: child.name,
        amount,
        currency,
        transactionId: transaction.id,
      }),
      riskLevel: 'low',
    });

    // Notify parent
    await db.notification.create({
      data: {
        userId: parentId,
        title: 'Recharge Enfant effectuée',
        message: `Vous avez rechargé la carte de ${child.name} de ${amount.toFixed(2)} ${currency}.`,
        type: 'general',
      },
    });

    // Notify child
    await db.notification.create({
      data: {
        userId: childId,
        title: 'Carte rechargée',
        message: `Votre parent a rechargé votre carte TRAIT de ${amount.toFixed(2)} ${currency}.`,
        type: 'general',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Recharge de ${amount.toFixed(2)} ${currency} effectuée avec succès pour ${child.name}.`,
      parentBalances: {
        realBalance: updatedParent.realBalance,
        realBalanceFC: updatedParent.realBalanceFC,
      },
      childBalances: {
        realBalance: updatedChild.realBalance,
        realBalanceFC: updatedChild.realBalanceFC,
      },
      transaction,
    });
  } catch (error) {
    console.error('Child card recharge error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la recharge de la carte enfant' },
      { status: 500 }
    );
  }
}
