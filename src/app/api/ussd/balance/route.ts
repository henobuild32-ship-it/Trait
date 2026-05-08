import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const currency = searchParams.get('currency') || 'USD';

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { realBalance: true, bonusBalance: true, realBalanceFC: true, bonusBalanceFC: true, tempBlocked: true, suspended: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué. Contactez le support.', blocked: true });
    }

    if (user.suspended) {
      return NextResponse.json({ success: false, message: 'Votre compte est suspendu. Contactez le support.', suspended: true });
    }

    if (currency === 'FC') {
      return NextResponse.json({
        success: true,
        realBalance: user.realBalanceFC,
        bonusBalance: user.bonusBalanceFC,
        totalBalance: user.realBalanceFC + user.bonusBalanceFC,
        currency: 'FC',
      });
    }

    return NextResponse.json({
      success: true,
      realBalance: user.realBalance,
      bonusBalance: user.bonusBalance,
      totalBalance: user.realBalance + user.bonusBalance,
      currency: 'USD',
    });
  } catch (error) {
    console.error('USSD balance error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
