import { NextResponse } from 'next/server';

const CURRENT_VERSION = '0.3.0';
const RELEASE_DATE = '2026-06-11';
const CHANGELOG = [
  '🔒 Sécurité renforcée : mots de passe et PIN chiffrés',
  '🔐 Authentification JWT pour toutes les API',
  '🛡️ Routes administrateur protégées',
  '💳 CVV des cartes masqué dans les réponses',
  '⚡ Transactions financières atomiques (plus sécurisées)',
  '📱 Système de mise à jour automatique',
  '🔑 Vérification OTP sécurisée',
  '🚫 Blocage après 5 tentatives PIN échouées',
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
