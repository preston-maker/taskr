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
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar TEXT,
      last_login TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

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
      due_date DATE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_tiers (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_tags (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#888888',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS review_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      tasks_reviewed INTEGER DEFAULT 0
    );

    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;

    UPDATE custom_tiers SET label = 'later' WHERE label = 'backlog' AND sort_order = 3;

    INSERT INTO custom_tiers (label, sort_order)
    SELECT label, sort_order FROM (VALUES
      ('do it now', 1),
      ('do it soon', 2),
      ('later', 3)
    ) AS v(label, sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM custom_tiers LIMIT 1);

    INSERT INTO custom_tags (label, color)
    SELECT label, color FROM (VALUES
      ('sales', '#c8c8c8'),
      ('admin', '#888888'),
      ('personal', '#aaaaaa'),
      ('revenue', '#ffffff')
    ) AS v(label, color)
    WHERE NOT EXISTS (SELECT 1 FROM custom_tags LIMIT 1);
  `)
}
