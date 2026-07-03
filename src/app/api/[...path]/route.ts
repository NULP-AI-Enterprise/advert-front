import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

type Params = { params: Promise<{ path: string[] }> }

async function handler(req: NextRequest, { params }: Params) {
  const { path } = await params
  const search = req.nextUrl.search
  const backendUrl = `${BACKEND_URL}/api/${path.join('/')}${search}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = req.body ?? undefined
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore — Node 18 fetch needs this for streaming bodies
      duplex: 'half',
    })

    const resHeaders = new Headers(upstream.headers)
    resHeaders.delete('transfer-encoding')

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch (err) {
    console.error(`[proxy] ${req.method} ${backendUrl}`, err)
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
