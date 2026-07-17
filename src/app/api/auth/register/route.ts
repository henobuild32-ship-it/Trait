import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken, setTokenCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, pseudo, country, role, pin, password, email, gender, city, address, photoId } = body as {
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
      address?: string
      photoId?: string
    }

    if (!phone || !name || !pseudo || !country || !role || !password) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      )
    }

    if (role !== 'client' && role !== 'agent') {
      return NextResponse.json(
        { success: false, message: 'Le rôle doit être "client" ou "agent"' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Ce numéro de téléphone est déjà enregistré' },
        { status: 409 }
      )
    }

    if (role === 'agent' && email) {
      const existingEmail = await db.user.findFirst({
        where: { email: email.trim().toLowerCase() },
      })
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        )
      }
    }

    const isAgent = role === 'agent'
    const validationStatus = isAgent ? 'pending' : 'validated'
    const bonusBalance = isAgent ? 0 : 10

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Hash pin if provided
    let hashedPin: string | null = null
    if (pin) {
      const { hashPin } = await import('@/lib/auth')
      hashedPin = await hashPin(pin)
    }

    const user = await db.user.create({
      data: {
        phone,
        name,
        pseudo,
        country,
        role,
        pin: hashedPin,
        password: hashedPassword,
        email: isAgent ? (email?.trim().toLowerCase() || null) : (email?.trim() || null),
        gender: gender || null,
        city: city?.trim() || null,
        address: address?.trim() || null,
        photoId: photoId || null,
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance,
        bonusBalanceFC: 0,
        validationStatus,
      },
    })

    // Sign JWT and set auth cookie
    const token = await signToken({ userId: user.id, role: user.role })
    const response = NextResponse.json({
      success: true,
      token,
      user: {
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
        address: user.address,
        photoId: user.photoId,
      },
    })
    setTokenCookie(response, token)
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
