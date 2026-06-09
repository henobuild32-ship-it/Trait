import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Constants ───────────────────────────────────────────────────────

const DAILY_TRANSACTION_LIMIT = 10;

// ─── Helper: Log security event ─────────────────────────────────────

export async function logSecurityEvent(data: {
  userId?: string;
  adminId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel?: string;
}) {
  try {
    await db.securityLog.create({
      data: {
        userId: data.userId || null,
        adminId: data.adminId || null,
        action: data.action,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        riskLevel: data.riskLevel || 'low',
      },
    });
  } catch (error) {
    console.error('Security log error:', error);
  }
}

// ─── Helper: Check daily transaction limit ──────────────────────────

export async function checkDailyLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number; remaining: number }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [sentCount, withdrawalCount, internationalCount] = await Promise.all([
    db.transaction.count({
      where: {
        senderId: userId,
        createdAt: { gte: todayStart },
        status: { in: ['completed', 'pending'] },
      },
    }),
    db.withdrawal.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
        status: { in: ['completed', 'pending'] },
      },
    }),
    db.internationalTransfer.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    }),
  ]);

  const count = sentCount + withdrawalCount + internationalCount;
  const allowed = count < DAILY_TRANSACTION_LIMIT;

  return {
    allowed,
    count,
    limit: DAILY_TRANSACTION_LIMIT,
    remaining: Math.max(0, DAILY_TRANSACTION_LIMIT - count),
  };
}

// ─── Helper: Check KYC status for international transfers ────────────

export async function checkKYC(
  userId: string
): Promise<{ verified: boolean; status: string; rejectReason?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, kycRejectReason: true },
  });

  if (!user) {
    return { verified: false, status: 'not_found' };
  }

  return {
    verified: user.kycStatus === 'verified',
    status: user.kycStatus,
    rejectReason: user.kycRejectReason || undefined,
  };
}

// ─── Helper: Detect suspicious activity ─────────────────────────────

export async function detectSuspiciousActivity(
  userId: string,
  amount?: number
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  // Check for rapid successive transactions (more than 5 in last 30 min)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentCount = await db.transaction.count({
    where: {
      senderId: userId,
      createdAt: { gte: thirtyMinAgo },
      status: { in: ['completed', 'pending'] },
    },
  });

  if (recentCount >= 5) {
    reasons.push(`${recentCount} transactions dans les 30 dernières minutes`);
  }

  // Check for high-value transaction (>$500)
  if (amount && amount > 500) {
    reasons.push(`Transaction élevée: $${amount}`);
  }

  // Check daily limit approaching
  const dailyCheck = await checkDailyLimit(userId);
  if (dailyCheck.remaining <= 2) {
    reasons.push(`Limite journalière bientôt atteinte: ${dailyCheck.remaining} restante(s)`);
  }

  // Check if user is new (less than 24h old)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (user) {
    const accountAge = Date.now() - user.createdAt.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (accountAge < oneDay && amount && amount > 100) {
      reasons.push('Compte récent + transaction élevée');
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

export async function checkChildBalanceLimit(
  userId: string,
  incomingAmount: number,
  currency: string
): Promise<{ allowed: boolean; message?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { parentId: true, realBalance: true, realBalanceFC: true }
  });
  if (!user || !user.parentId) {
    return { allowed: true };
  }
  const isFC = currency === 'FC' || currency === 'CDF';
  const currentBalance = isFC ? user.realBalanceFC : user.realBalance;
  const maxLimit = isFC ? 10000000 : 1000;
  if (currentBalance + incomingAmount > maxLimit) {
    return {
      allowed: false,
      message: `Le solde du compte enfant après cette opération dépasserait la limite autorisée (${maxLimit.toLocaleString('fr-FR')} ${isFC ? 'CDF' : 'USD'}).`
    };
  }
  return { allowed: true };
}
