import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: compare two semantic version strings (e.g. "1.2.3" vs "1.3.0")
// Returns: positive if a > b, negative if a < b, 0 if equal
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < len; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }

  return 0;
}

// GET - Check for app updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('currentVersion') || '0.0.0';

    // Seed default version if none exists
    const count = await db.appVersion.count();
    if (count === 0) {
      await db.appVersion.create({
        data: {
          version: '1.0.0',
          description: 'Version initiale',
          isCurrent: true,
        },
      });
    }

    // Find all versions
    const versions = await db.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Find the latest version that is newer than the current one
    const newerVersions = versions.filter(
      v => compareVersions(v.version, currentVersion) > 0
    );

    if (newerVersions.length === 0) {
      // No update available - return current version info
      const latestVersion = versions[0];
      return NextResponse.json({
        success: true,
        hasUpdate: false,
        latestVersion: latestVersion?.version || '1.0.0',
      });
    }

    // Return the newest version available
    const latestNewer = newerVersions[0];
    return NextResponse.json({
      success: true,
      hasUpdate: true,
      latestVersion: latestNewer.version,
      description: latestNewer.description || undefined,
      downloadUrl: latestNewer.downloadUrl || undefined,
    });
  } catch (error) {
    console.error('App version check error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
