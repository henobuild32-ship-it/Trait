import { NextResponse } from 'next/server';

const CURRENT_VERSION = '2.0.0';
const RELEASE_DATE = '2026-06-30';
const CHANGELOG = [
  '🎯 Version 2.0 — Nouvelle identité visuelle',
  '📱 QR Code personnel noir & blanc avec lien unique',
  '🔗 Paiement par scan : /pay/[userId]',
  '⚡ Temps réel : WebSocket Socket.IO',
  '🔔 Notifications centralisées (DB + WebSocket + Push)',
  '📴 Mode hors ligne : files d\'attente IndexedDB',
  '🔐 Authentification à deux facteurs (2FA/TOTP)',
  '💳 Dépôt 4 méthodes : Mobile Money, Banque, Visa, Agent',
  '🎫 Système de support client avec historique',
  '✅ Admin KYC : validation documents + selfie',
  '🏧 Changement de PIN sécurisé',
];

export async function GET() {
  return NextResponse.json({
    success: true,
    version: CURRENT_VERSION,
    releaseDate: RELEASE_DATE,
    changelog: CHANGELOG,
    minAppVersion: '0.2.0',
  });
}
