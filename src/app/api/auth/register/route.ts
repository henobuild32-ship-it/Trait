import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, pseudo, country, role, pin, password, email, gender, city } = body as {
      phone: string
      name: string
      pseudo: string
      country: string
      role: 'client' | 'agent'
      pin: string
      password: string
      email?: string
      gender?: string
      city?: string
    }

    if (!phone || !name || !pseudo || !country || !role || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (role !== 'client' && role !== 'agent') {
      return NextResponse.json(
        { success: false, message: 'Role must be "client" or "agent"' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Phone number already registered' },
        { status: 409 }
      )
    }

    // Agent vs Client settings
    const isAgent = role === 'agent'
    const validationStatus = isAgent ? 'pending' : 'validated'
    const bonusBalance = isAgent ? 0 : 10
    const bonusBalanceFC = isAgent ? 0 : 0

    // No agentCode generated at registration for agents (generated on validation as agentNumber)

    const user = await db.user.create({
      data: {
        phone,
        name,
        pseudo,
        country,
        role,
        pin: pin || null,
        password,
        email: email?.trim() || null,
        gender: gender || null,
        city: city?.trim() || null,
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance,
        bonusBalanceFC,
        validationStatus,
      },
    })

    const safeUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      pseudo: user.pseudo,
      email: user.email,
      gender: user.gender,
      city: user.city,
      country: user.country,
      role: user.role,
      agentCode: user.agentCode,
      agentNumber: user.agentNumber,
      validationStatus: user.validationStatus,
      validationRejectReason: user.validationRejectReason,
      realBalance: user.realBalance,
      realBalanceFC: user.realBalanceFC,
      bonusBalance: user.bonusBalance,
      bonusBalanceFC: user.bonusBalanceFC,
      isVerified: user.isVerified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    }

    return NextResponse.json({ success: true, user: safeUser })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
