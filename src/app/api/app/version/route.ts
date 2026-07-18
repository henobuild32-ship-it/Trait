import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('currentVersion');

    const latest = await db.appVersion.findFirst({
      where: { isCurrent: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({
        success: true,
        version: '2.0.0',
        releaseDate: '2026-06-30',
        changelog: [
          'Version 2.0 — Nouvelle identité visuelle',
          'QR Code personnel noir & blanc',
          'Paiement par scan : /pay/[userId]',
          'Temps réel : WebSocket Socket.IO',
          'Mode hors ligne : files d\'attente IndexedDB',
          'Authentification à deux facteurs (2FA/TOTP)',
          'Dépôt 4 méthodes : Mobile Money, Banque, Visa, Agent',
          'Système de support client avec historique',
          'Admin KYC : validation documents + selfie',
          'Changement de PIN sécurisé',
        ],
        minAppVersion: '0.2.0',
        hasUpdate: false,
        latestVersion: '2.0.0',
        downloadUrl: null,
      });
    }

    const hasUpdate = currentVersion ? currentVersion !== latest.version : false;

    return NextResponse.json({
      success: true,
      version: latest.version,
      releaseDate: latest.createdAt.toISOString().split('T')[0],
      changelog: latest.description ? latest.description.split('\n').filter(Boolean) : [],
      minAppVersion: '0.2.0',
      hasUpdate,
      latestVersion: latest.version,
      downloadUrl: latest.downloadUrl,
    });
  } catch (error) {
    console.error('Version error:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' }, { status: 500 });
  }
}
