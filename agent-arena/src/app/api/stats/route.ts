import { NextResponse } from 'next/server';
import { getGlobalStats, getRecentMatches } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getGlobalStats();
    const recentMatches = await getRecentMatches(10);

    return NextResponse.json({ stats, recentMatches });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
