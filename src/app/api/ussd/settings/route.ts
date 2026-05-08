import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: User settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT: Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ussdLanguage, defaultCurrency, smsNotifications } = body;

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
