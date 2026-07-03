import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://advertising_user:advertising_pass@localhost:5432/advertising_db',
});

const ENRICHMENT_URL = process.env.ENRICHMENT_URL ?? 'http://localhost:8001';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { item_id } = body;

  const row = await pool.query('SELECT title FROM media_items WHERE id = $1', [item_id]);
  if (row.rowCount === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  const title = row.rows[0].title;

  await pool.query(
    'UPDATE media_items SET description = NULL, updated_at = NOW() WHERE id = $1',
    [item_id]
  );

  try {
    const res = await fetch(
      `${ENRICHMENT_URL}/enrich/item/${item_id}?title=${encodeURIComponent(title)}`,
      { method: 'POST', signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`Enrichment service returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ success: true, item_id, task_id: data.task_id });
  } catch (err) {
    return NextResponse.json(
      { success: false, item_id, error: String(err), hint: 'Enrichment service unreachable — run python3.11 run_production.py manually' },
      { status: 202 }
    );
  }
}
