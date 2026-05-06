import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined,
})

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err.message)
})

export const connectToDB = async () => {
  console.log('🔌 Connecting to PostgreSQL...')
  try {
    const client = await pool.connect()
    const { rows } = await client.query('SELECT NOW()')
    console.log(`✅ DB connected. Server time: ${rows[0].now}`)
    client.release()
    return true
  } catch (error) {
    console.error('❌ DB connection error:', error.message)
    throw error
  }
}

export const query = (text, params) => pool.query(text, params)
