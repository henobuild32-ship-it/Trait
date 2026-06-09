import { db } from '@/lib/db';

export function normalizeAgentIdentifier(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export async function findActiveAgentByIdentifier(identifier: string) {
  const value = normalizeAgentIdentifier(identifier);
  if (!value) return null;

  return db.user.findFirst({
    where: {
      role: 'agent',
      suspended: false,
      validationStatus: 'validated',
      OR: [
        { agentCode: value },
        { agentNumber: value },
      ],
    },
  });
}

