import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, pseudo, country, role, pin, password } = body as {
      phone: string
      name: string
      pseudo: string
      country: string
      role: 'client' | 'agent'
      pin: string
      password: string
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

    // Generate agent code if role is agent
    let agentCode: string | undefined
    if (role === 'agent') {
      let unique = false
      while (!unique) {
        const digits = Math.floor(100000 + Math.random() * 900000).toString()
        agentCode = `AGT-${digits}`
        const existingCode = await db.user.findUnique({
          where: { agentCode },
        })
        if (!existingCode) {
          unique = true
        }
      }
    }

    const user = await db.user.create({
      data: {
        phone,
        name,
        pseudo,
        country,
        role,
        pin: pin || null,
        password,
        agentCode,
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance: 10,
        bonusBalanceFC: 0,
      },
    })

    const safeUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      pseudo: user.pseudo,
      country: user.country,
      role: user.role,
      agentCode: user.agentCode,
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
