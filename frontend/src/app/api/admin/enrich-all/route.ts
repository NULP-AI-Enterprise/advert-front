import { NextRequest, NextResponse } from 'next/server';

const ENRICHMENT_URL = process.env.ENRICHMENT_URL ?? 'http://localhost:8001';

export async function POST(_request: NextRequest) {
  try {
    const res = await fetch(`${ENRICHMENT_URL}/enrich/start`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Enrichment service returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json({
      success: true,
      queued_estimate: data.queued_estimate,
      total_unenriched: data.total_unenriched,
      count: data.queued_estimate,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err), hint: 'Enrichment service unreachable — run python3.11 run_production.py manually' },
      { status: 202 }
    );
  }
}
