import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, email, city, address, businessName, businessType, location, password } = body as {
      phone: string
      name: string
      email?: string
      city?: string
      address?: string
      businessName: string
      businessType: string
      location: string
      password: string
    }

    if (!phone || !name || !businessName || !businessType || !location || !password) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs requis doivent être remplis' },
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

    if (email) {
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

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        phone,
        name,
        email: email?.trim().toLowerCase() || null,
        city: city?.trim() || null,
        address: address?.trim() || null,
        country: 'CD',
        businessName,
        businessType,
        location,
        password: hashedPassword,
        role: 'seller',
        validationStatus: 'pending',
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance: 0,
        bonusBalanceFC: 0,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        validationStatus: user.validationStatus,
        businessName: user.businessName,
        city: user.city,
        location: user.location,
      },
    })
  } catch (error) {
    console.error('Seller Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
