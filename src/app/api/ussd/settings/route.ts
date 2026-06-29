import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    let settings = await db.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await db.userSettings.create({ data: { userId } });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, ussdLanguage, defaultCurrency, smsNotifications } = body;

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    const settings = await db.userSettings.upsert({
      where: { userId },
      update: {
        ...(ussdLanguage !== undefined && { ussdLanguage }),
        ...(defaultCurrency !== undefined && { defaultCurrency }),
        ...(smsNotifications !== undefined && { smsNotifications }),
      },
      create: {
        userId,
        ussdLanguage: ussdLanguage || 'fr',
        defaultCurrency: defaultCurrency || 'USD',
        smsNotifications: smsNotifications || false,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
