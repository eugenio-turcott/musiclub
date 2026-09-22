import { NextResponse } from 'next/server';
import {
  getTrendingReleases,
  getMonthlyTrendingReleases,
  getAnticipatedReleases,
} from '../../../services/trendingService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'catalog';
    const forceRefresh = searchParams.get('refresh') === 'true';
    const defaultLimit = (type === 'weekly' || type === 'monthly' || type === 'recordclub') ? '100' : '50';
    const limit = parseInt(searchParams.get('limit') || defaultLimit, 10);

    let result;
    if (type === 'weekly' || type === 'monthly' || type === 'recordclub') {
      result = await getMonthlyTrendingReleases({ forceRefresh, limit });
    } else if (type === 'anticipated' || type === 'upcoming') {
      const list = await getAnticipatedReleases();
      result = { success: true, releases: Array.isArray(list) ? list : [] };
    } else {
      result = await getTrendingReleases({ forceRefresh, limit });
    }

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener tendencias musicales',
        releases: [],
      },
      { status: 500 }
    );
  }
}

