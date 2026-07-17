import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required')
}
const SECRET = new TextEncoder().encode(secret)

const TOKEN_COOKIE = 'trait_token';
const ADMIN_TOKEN_COOKIE = 'trait_admin_token';

// ─── JWT ────────────────────────────────────────────────────────────

export async function signToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export function setTokenCookie(response: NextResponse, token: string, isAdmin = false) {
  response.cookies.set(isAdmin ? ADMIN_TOKEN_COOKIE : TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearTokenCookie(response: NextResponse, isAdmin = false) {
  response.cookies.set(isAdmin ? ADMIN_TOKEN_COOKIE : TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ─── Password helpers (with lazy migration from plain text) ──────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyAndMigratePassword(
  userId: string,
  inputPassword: string,
  storedPassword: string
): Promise<boolean> {
  // Already hashed with bcrypt
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  // Plain text (legacy) — migrate on successful login
  if (storedPassword === inputPassword) {
    const hashed = await hashPassword(inputPassword);
    await db.user.update({
      where: { id: userId },
      data: { password: hashed },
    }).catch(() => {});
    return true;
  }

  return false;
}

// ─── PIN helpers (with lazy migration from plain text) ──────────────

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyAndMigratePin(
  userId: string,
  inputPin: string,
  storedPin: string | null
): Promise<boolean> {
  if (!storedPin) return false;

  // Already hashed with bcrypt
  if (storedPin.startsWith('$2')) {
    return bcrypt.compare(inputPin, storedPin);
  }

  // Plain text (legacy) — migrate on successful verify
  if (storedPin === inputPin) {
    const hashed = await hashPin(inputPin);
    await db.user.update({
      where: { id: userId },
      data: { pin: hashed },
    }).catch(() => {});
    return true;
  }

  return false;
}

// ─── Auth middleware ────────────────────────────────────────────────

export async function requireUser(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, message: 'Session invalide' }, { status: 401 });
  }
  return payload;
}

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || payload.role === 'user') {
    return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
  }
  return payload;
}

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, phone: true, role: true },
  })
  if (!user) return null
  return { id: user.id, phone: user.phone, role: user.role }
}

export const AUTH_ERROR = { success: false, message: 'Non authentifié' };
