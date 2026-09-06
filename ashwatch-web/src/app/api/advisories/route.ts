import { NextRequest, NextResponse } from 'next/server';
import { getDarwinAdvisories } from '@/lib/advisories';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isFresh = searchParams.has('t') || searchParams.has('fresh');
    const data = await getDarwinAdvisories(isFresh);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': isFresh
          ? 'no-store, no-cache, max-age=0, must-revalidate'
          : 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve volcanic ash advisories', details: String(error) },
      { status: 500 }
    );
  }
}
