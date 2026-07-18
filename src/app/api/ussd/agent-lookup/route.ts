import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code agent requis' }, { status: 400 });
    }

    const normalized = code.trim().toUpperCase().replace(/\s+/g, '');

    const agent = await db.user.findFirst({
      where: {
        role: 'agent',
        suspended: false,
        validationStatus: 'validated',
        OR: [
          { agentCode: normalized },
          { agentNumber: normalized },
        ],
      },
      select: {
        name: true,
        pseudo: true,
        businessName: true,
        agentCode: true,
        phone: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent non trouvé' });
    }

    return NextResponse.json({
      success: true,
      agent: {
        name: agent.businessName || agent.name || agent.pseudo || 'Agent',
        code: agent.agentCode,
        phone: agent.phone,
      },
    });
  } catch (error) {
    console.error('Agent lookup error:', error);
    return NextResponse.json({ success: false, message: 'Erreur interne' }, { status: 500 });
  }
}
