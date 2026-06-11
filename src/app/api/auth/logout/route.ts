import { NextRequest, NextResponse } from 'next/server'
import { clearTokenCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Déconnexion réussie' })
  clearTokenCookie(response)
  return response
}
