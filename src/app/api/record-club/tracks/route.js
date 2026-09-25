import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, data: [] });
    }

    const cleanId = String(id).replace(/^rc_/, '').trim();
    const res = await fetch(`https://api.record.club/releases/${cleanId}/tracks`, {
      headers: {
        'User-Agent': 'MusiClub/1.0 (https://musiclub.club)',
        Accept: 'application/json',
      },
      signal:
        typeof AbortSignal !== 'undefined' && AbortSignal.timeout
          ? AbortSignal.timeout(6000)
          : undefined,
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ success: false, data: [] });
  }
}
