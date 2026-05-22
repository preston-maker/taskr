import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      tier INTEGER NOT NULL DEFAULT 2,
      tag TEXT DEFAULT 'admin',
      is_revenue BOOLEAN DEFAULT FALSE,
      is_recurring BOOLEAN DEFAULT FALSE,
      recur_interval TEXT,
      recur_days INTEGER,
      next_recur_at TIMESTAMPTZ,
      last_completed_at TIMESTAMPTZ,
      decay_score INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS review_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      tasks_reviewed INTEGER DEFAULT 0
    );
  `)
}
