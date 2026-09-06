import { NextResponse } from 'next/server';
import { getDarwinAdvisories } from '@/lib/advisories';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes cache

export async function GET() {
  try {
    const data = await getDarwinAdvisories();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve volcanic ash advisories', details: String(error) },
      { status: 500 }
    );
  }
}
