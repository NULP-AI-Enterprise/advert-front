import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://advertising_user:advertising_pass@localhost:5432/advertising_db',
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const { title, description, category, tags, audience, metrics } = body;

    await pool.query(
      `UPDATE media_items
       SET title=$1, description=$2, category=$3, tags=$4, audience=$5, metrics=$6, updated_at=NOW()
       WHERE id=$7`,
      [
        title,
        description ?? null,
        category ?? null,
        tags ?? [],
        audience != null ? (typeof audience === 'string' ? audience : JSON.stringify(audience)) : null,
        metrics != null ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : null,
        id,
      ]
    );

    const result = await pool.query(
      `SELECT id, title, description, category, tags, audience, metrics,
         CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding,
         created_at, updated_at
       FROM media_items WHERE id=$1`,
      [id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error('[admin/media-items PUT]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await pool.query('DELETE FROM media_items WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[admin/media-items DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
