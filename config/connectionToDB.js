import { Pool } from 'pg'
import { connectionString } from './conectionCredentials.js'

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined,
})

export const connectionToDB = async () => {
  console.log('🔌 Intentando conectar con la base de datos...')

  try {
    const client = await pool.connect()
    const { rows } = await client.query('SELECT NOW()')
    console.log(`✅ Conexión establecida. Hora del servidor: ${rows[0].now}`)
    client.release()
    return true
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message)
    return false
  }
}