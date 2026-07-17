import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, amount } = body

    if (!goalId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'ID objectif et montant requis' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
    if (!goal) {
      return NextResponse.json({ success: false, message: 'Objectif d\'épargne introuvable' }, { status: 404 })
    }

    if (goal.userId !== auth.id) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    if (goal.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Cet objectif d\'épargne n\'est plus actif' }, { status: 400 })
    }

    const isFC = goal.currency === 'FC'
    const balanceField = isFC ? 'realBalanceFC' : 'realBalance'

    const user = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const userBalance = isFC ? user.realBalanceFC : user.realBalance
    if (userBalance < parseFloat(amount)) {
      return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
    }

    const newAmount = goal.currentAmount + parseFloat(amount)
    const isCompleted = newAmount >= goal.targetAmount

    await prisma.$transaction([
      prisma.savingsContribution.create({
        data: {
          goalId,
          amount: parseFloat(amount),
          currency: goal.currency,
          type: 'manual',
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: { increment: parseFloat(amount) },
          ...(isCompleted ? { status: 'completed', completedAt: new Date() } : {}),
        },
      }),
      prisma.user.update({
        where: { id: auth.id },
        data: { [balanceField]: { decrement: parseFloat(amount) } },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: isCompleted ? 'Objectif d\'épargne atteint ! Félicitations !' : 'Contribution ajoutée avec succès',
      goal: {
        ...goal,
        currentAmount: newAmount,
        status: isCompleted ? 'completed' : 'active',
      },
    })
  } catch (error) {
    console.error('Savings contribute POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
