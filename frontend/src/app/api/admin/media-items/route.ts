import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://advertising_user:advertising_pass@localhost:5432/advertising_db',
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }
  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countValues = [...values];
  const dataValues = [...values, pageSize, offset];

  const [countResult, dataResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM media_items ${where}`, countValues),
    pool.query(
      `SELECT id, title, description, category, tags, audience, metrics,
        CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding,
        created_at, updated_at
       FROM media_items ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues
    ),
  ]);

  return NextResponse.json({
    items: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category, tags, audience, metrics } = body;

  const result = await pool.query(
    `INSERT INTO media_items (id, title, description, category, tags, audience, metrics, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id, title, description, category, tags, audience, metrics,
       CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding,
       created_at, updated_at`,
    [
      title,
      description ?? null,
      category ?? null,
      tags ?? [],
      audience != null ? (typeof audience === 'string' ? audience : JSON.stringify(audience)) : null,
      metrics != null ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : null,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
