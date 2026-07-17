import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, signToken, hashPassword } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security'
import { LoginSchema, validateRequest } from '@/lib/validations'

export async function GET() {
  const results: Record<string, string> = {}

  // 1. Test DB
  try {
    const c = await db.user.count()
    results.db = `OK (${c} users)`
  } catch (e: any) {
    results.db = `FAIL: ${e.message?.substring(0, 100)}`
  }

  // 2. Test auth
  try {
    const h = await hashPassword('test')
    results.auth = `OK (hash: ${h.substring(0, 10)}...)`
  } catch (e: any) {
    results.auth = `FAIL: ${e.message?.substring(0, 100)}`
  }

  // 3. Test signToken
  try {
    const t = await signToken({ userId: 'test', role: 'client' })
    results.signToken = 'OK'
  } catch (e: any) {
    results.signToken = `FAIL: ${e.message?.substring(0, 100)}`
  }

  // 4. Test rate-limit
  try {
    const r = checkRateLimit({ windowMs: 1000, maxRequests: 10 })
    results.rateLimit = `OK (allowed: ${r.allowed})`
  } catch (e: any) {
    results.rateLimit = `FAIL: ${e.message?.substring(0, 100)}`
  }

  // 5. Test security
  try {
    await logSecurityEvent({ action: 'diagnostic', details: 'test' })
    results.security = 'OK'
  } catch (e: any) {
    results.security = `FAIL: ${e.message?.substring(0, 100)}`
  }

  // 6. Test validations
  try {
    const v = validateRequest(LoginSchema, { phone: '+243810000001', password: '1234' })
    results.validations = `OK (valid: ${v.success})`
  } catch (e: any) {
    results.validations = `FAIL: ${e.message?.substring(0, 100)}`
  }

  return NextResponse.json({ success: true, results })
}
