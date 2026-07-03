import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.text();
    const res = await fetch(`${BACKEND_URL}/api/admin/media-items/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/media-items/${params.id}`, {
      method: 'DELETE',
    });
    if (res.status === 204) return NextResponse.json({ success: true });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
