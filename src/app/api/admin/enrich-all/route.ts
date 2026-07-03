import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function POST(_request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/enrich-all`, { method: 'POST' });
    return NextResponse.json({ success: res.ok }, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
