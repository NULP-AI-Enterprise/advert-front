import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/media-items${search}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const res = await fetch(`${BACKEND_URL}/api/admin/media-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
