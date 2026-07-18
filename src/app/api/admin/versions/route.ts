import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const versions = await db.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, versions });
  } catch (error) {
    console.error('Versions error:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, description, downloadUrl } = body;

    if (!version) {
      return NextResponse.json({ success: false, message: 'Version requise' }, { status: 400 });
    }

    await db.appVersion.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });

    const created = await db.appVersion.create({
      data: { version, description, downloadUrl, isCurrent: true },
    });

    return NextResponse.json({ success: true, version: created }, { status: 201 });
  } catch (error) {
    console.error('Version create error:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' }, { status: 500 });
  }
}
