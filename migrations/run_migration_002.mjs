import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, '002_prefreido_schema.sql'), 'utf8')

const client = new Client({
  connectionString: 'postgresql://postgres:101120@localhost:5432/EmiroAPPcc',
})

try {
  await client.connect()
  console.log('✅ Conectado a la base de datos')
  await client.query(sql)
  console.log('✅ Migración 002 ejecutada correctamente')
} catch (err) {
  console.error('❌ Error en la migración:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
