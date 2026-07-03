import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const { item_id } = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/admin/media-items/${item_id}/reenrich`, {
      method: 'POST',
    });
    return NextResponse.json({ success: res.ok }, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
