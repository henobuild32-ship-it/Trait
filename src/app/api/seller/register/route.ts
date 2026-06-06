import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, businessName, businessType, location, password } = body as {
      phone: string
      name: string
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

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Ce numéro de téléphone est déjà enregistré' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        phone,
        name,
        businessName,
        businessType,
        location,
        password,
        role: 'seller',
        validationStatus: 'pending',
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance: 0,
        bonusBalanceFC: 0,
      },
    })

    const safeUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      validationStatus: user.validationStatus,
      businessName: user.businessName,
    }

    return NextResponse.json({ success: true, user: safeUser })
  } catch (error) {
    console.error('Seller Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
