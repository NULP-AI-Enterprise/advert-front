import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const uri = limit
      ? `${BACKEND_URL}/api/admin/enrich-all?limit=${limit}`
      : `${BACKEND_URL}/api/admin/enrich-all`;

    const res = await fetch(uri, { method: 'POST' });
    const data = res.ok ? await res.json().catch(() => ({})) : {};
    return NextResponse.json({ success: res.ok, ...data }, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
