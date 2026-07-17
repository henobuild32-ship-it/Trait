import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAndMigratePassword, signToken, setTokenCookie } from '@/lib/auth'
import { LoginSchema, validateRequest } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // Step 1: parse body
    let body: any
    try {
      body = await request.json()
    } catch (e: any) {
      return NextResponse.json({ success: false, step: 'json', error: e.message }, { status: 500 })
    }

    // Step 2: validate
    const validation = validateRequest(LoginSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, step: 'validate', error: validation.error }, { status: 400 })
    }

    const { phone, password } = validation.data

    // Step 3: find user
    let user: any
    try {
      user = await db.user.findUnique({ where: { phone: phone.trim() } })
    } catch (e: any) {
      return NextResponse.json({ success: false, step: 'findUnique', error: e.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, step: 'notfound', phone }, { status: 404 })
    }

    // Step 4: verify password
    let isValid = false
    try {
      isValid = await verifyAndMigratePassword(user.id, password.trim(), user.password)
    } catch (e: any) {
      return NextResponse.json({ success: false, step: 'verifyPassword', error: e.message }, { status: 500 })
    }

    if (!isValid) {
      return NextResponse.json({ success: false, step: 'wrongpassword' }, { status: 401 })
    }

    // Step 5: sign token
    let token: string
    try {
      token = await signToken({ userId: user.id, role: user.role })
    } catch (e: any) {
      return NextResponse.json({ success: false, step: 'signToken', error: e.message }, { status: 500 })
    }

    // Step 6: create response with cookie
    let response: NextResponse
    try {
      response = NextResponse.json({ success: true, token, userId: user.id })
      setTokenCookie(response, token)
    } catch (e: any) {
      return NextResponse.json({ success: false, step: 'cookie', error: e.message }, { status: 500 })
    }

    return response
  } catch (e: any) {
    return NextResponse.json({ success: false, step: 'unknown', error: e.message }, { status: 500 })
  }
}
