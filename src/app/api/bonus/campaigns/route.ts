import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List campaigns ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const campaigns = await db.bonusCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, name: true },
        },
        history: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, pseudo: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        bonusAmount: c.bonusAmount,
        currency: c.currency,
        targetUsers: c.targetUsers,
        targetUserIds: c.targetUserIds ? JSON.parse(c.targetUserIds) : [],
        status: c.status,
        maxDistributions: c.maxDistributions,
        currentCount: c.currentCount,
        startDate: c.startDate,
        endDate: c.endDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        admin: c.admin,
        recentDistributions: c.history.map((h) => ({
          id: h.id,
          user: h.user,
          amount: h.amount,
          currency: h.currency,
          createdAt: h.createdAt,
        })),
      })),
    })
  } catch (error) {
    console.error('Campaign list error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── POST: Create new campaign ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      adminId,
      name,
      description,
      bonusAmount,
      currency,
      targetUsers,
      targetUserIds,
      maxDistributions,
      endDate,
    } = body as {
      adminId: string
      name: string
      description?: string
      bonusAmount: number
      currency: string
      targetUsers: string
      targetUserIds?: string[]
      maxDistributions?: number
      endDate?: string
    }

    // Validate required fields
    if (!adminId || !name || bonusAmount === undefined || !currency) {
      return NextResponse.json(
        { success: false, message: 'adminId, name, bonusAmount, and currency are required' },
        { status: 400 }
      )
    }

    if (typeof bonusAmount !== 'number' || bonusAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'bonusAmount must be a positive number' },
        { status: 400 }
      )
    }

    if (!['USD', 'FC'].includes(currency)) {
      return NextResponse.json(
        { success: false, message: 'Currency must be USD or FC' },
        { status: 400 }
      )
    }

    const validTargets = ['all', 'new', 'specific']
    if (targetUsers && !validTargets.includes(targetUsers)) {
      return NextResponse.json(
        { success: false, message: 'targetUsers must be all, new, or specific' },
        { status: 400 }
      )
    }

    // Verify admin exists
    const admin = await db.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Create campaign
    const campaign = await db.bonusCampaign.create({
      data: {
        adminId,
        name,
        description: description || null,
        bonusAmount,
        currency,
        targetUsers: targetUsers || 'all',
        targetUserIds: targetUserIds ? JSON.stringify(targetUserIds) : null,
        maxDistributions: maxDistributions ?? null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    // If targeting specific users, distribute immediately
    if (targetUsers === 'specific' && targetUserIds && targetUserIds.length > 0) {
      await distributeToUsers(campaign.id, campaign.bonusAmount, campaign.currency, targetUserIds, adminId)
    }

    // If targeting all or new users, distribute to matching users
    if (targetUsers === 'all' || targetUsers === 'new') {
      const targetWhere: Record<string, unknown> = {}
      if (targetUsers === 'new') {
        // New users = registered in last 30 days
        targetWhere.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }

      const targetUsersList = await db.user.findMany({
        where: targetWhere,
        select: { id: true },
      })

      if (targetUsersList.length > 0) {
        const userIds = targetUsersList.map((u) => u.id)
        await distributeToUsers(campaign.id, campaign.bonusAmount, campaign.currency, userIds, adminId)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      campaign,
    })
  } catch (error) {
    console.error('Campaign create error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update campaign status ─────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, status } = body as {
      campaignId: string
      status: string
    }

    if (!campaignId || !status) {
      return NextResponse.json(
        { success: false, message: 'campaignId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['active', 'paused', 'completed', 'expired']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const existing = await db.bonusCampaign.findUnique({
      where: { id: campaignId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Update campaign
    const campaign = await db.bonusCampaign.update({
      where: { id: campaignId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      message: `Campaign status updated to ${status}`,
      campaign,
    })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── Helper: Distribute bonus to users ───────────────────────────────
async function distributeToUsers(
  campaignId: string,
  amount: number,
  currency: string,
  userIds: string[],
  adminId: string
) {
  const campaign = await db.bonusCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign) return

  const maxDist = campaign.maxDistributions
  const currentCount = campaign.currentCount
  let distributed = 0

  for (const userId of userIds) {
    // Check max distributions limit
    if (maxDist !== null && currentCount + distributed >= maxDist) {
      break
    }

    // Update user bonus balance
    const updateField = currency === 'USD' ? 'bonusBalance' : 'bonusBalanceFC'
    await db.user.update({
      where: { id: userId },
      data: {
        [updateField]: { increment: amount },
      },
    })

    // Create bonus history entry
    await db.bonusHistory.create({
      data: {
        userId,
        type: 'campaign',
        amount,
        currency,
        description: `Bonus from campaign: ${campaign.name}`,
        adminId,
        campaignId,
        metadata: JSON.stringify({ campaignName: campaign.name }),
      },
    })

    distributed++
  }

  // Update campaign distribution count
  await db.bonusCampaign.update({
    where: { id: campaignId },
    data: { currentCount: { increment: distributed } },
  })
}
