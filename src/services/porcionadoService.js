import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

// ─── Opciones predefinidas para los dropdowns del frontend ──────────────────

const range = (start, end, step) => {
  const result = []
  for (let v = start; v <= end + 1e-9; v = parseFloat((v + step).toFixed(4))) {
    result.push(parseFloat(v.toFixed(4)))
  }
  return result
}

export const OPCIONES = {
  pesos:      range(32, 45, 0.5),        // 32, 32.5, … 45  g
  longitudes: range(6, 9, 0.25),         // 6, 6.25, … 9   cm
  amplitudes: range(3.5, 4, 0.1),        // 3.5, 3.6, … 4  cm
  grosores:   range(2.0, 2.5, 0.1),      // 2.0, 2.1, … 2.5 cm
  brix:       range(28, 32, 0.5),        // 28, 28.5, … 32
  cuartos:    [1, 2, 3, 4, 5, 6],
  responsables: ['EMIRO CEBALLOS', 'SAMIRA SARMIENTO'],
}

// ─── Semana ISO (calendario juliano semana-año) ──────────────────────────────

export function calcularLote(fechaStr) {
  // fechaStr: 'YYYY-MM-DD'
  const date = new Date(`${fechaStr}T12:00:00Z`)
  const jan4 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7))
  const diff = date - startOfWeek1
  let week = Math.floor(diff / (7 * 86400000)) + 1
  let year = date.getUTCFullYear()

  if (week < 1) {
    year -= 1
    const dec28Prev = new Date(Date.UTC(year, 11, 28))
    const jan4Prev = new Date(Date.UTC(year, 0, 4))
    const startPrev = new Date(jan4Prev)
    startPrev.setUTCDate(jan4Prev.getUTCDate() - ((jan4Prev.getUTCDay() + 6) % 7))
    week = Math.floor((dec28Prev - startPrev) / (7 * 86400000)) + 1
  }

  const dec28 = new Date(Date.UTC(date.getUTCFullYear(), 11, 28))
  const jan4Next = new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 4))
  const startNext = new Date(jan4Next)
  startNext.setUTCDate(jan4Next.getUTCDate() - ((jan4Next.getUTCDay() + 6) % 7))
  if (date >= startNext) {
    week = 1
    year = date.getUTCFullYear() + 1
  }

  return `${week}-${year}`
}

// ─── Estado automático según rangos ─────────────────────────────────────────

function calcularEstado(data) {
  const checks = []
  for (let i = 1; i <= 5; i++) {
    const p = data[`peso_${i}`]
    const l = data[`longitud_${i}`]
    const a = data[`amplitud_${i}`]
    const g = data[`grosor_${i}`]
    const b = data[`brix_${i}`]
    if (p != null) checks.push(p >= 32 && p <= 45)
    if (l != null) checks.push(l >= 6 && l <= 9)
    if (a != null) checks.push(a >= 3.5 && a <= 4)
    if (g != null) checks.push(g >= 2 && g <= 2.5)
    if (b != null) checks.push(b >= 28 && b <= 32)
  }
  if (checks.length === 0) return 'PENDIENTE'
  return checks.every(Boolean) ? 'CUMPLE' : 'NO CUMPLE'
}

// ─── Crear tabla ─────────────────────────────────────────────────────────────

export const ensurePorcionadoTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS registros_porcionado (
      id            SERIAL PRIMARY KEY,
      fecha         DATE        NOT NULL,
      lote          VARCHAR(20) NOT NULL,
      hora_inicio   TIME        NOT NULL,
      hora_fin      TIME,
      cuarto        SMALLINT    NOT NULL CHECK (cuarto BETWEEN 1 AND 6),

      peso_1        NUMERIC(6,2), peso_2 NUMERIC(6,2), peso_3 NUMERIC(6,2),
      peso_4        NUMERIC(6,2), peso_5 NUMERIC(6,2),

      longitud_1    NUMERIC(5,2), longitud_2 NUMERIC(5,2), longitud_3 NUMERIC(5,2),
      longitud_4    NUMERIC(5,2), longitud_5 NUMERIC(5,2),

      amplitud_1    NUMERIC(5,2), amplitud_2 NUMERIC(5,2), amplitud_3 NUMERIC(5,2),
      amplitud_4    NUMERIC(5,2), amplitud_5 NUMERIC(5,2),

      grosor_1      NUMERIC(5,2), grosor_2 NUMERIC(5,2), grosor_3 NUMERIC(5,2),
      grosor_4      NUMERIC(5,2), grosor_5 NUMERIC(5,2),

      brix_1        NUMERIC(5,2), brix_2 NUMERIC(5,2), brix_3 NUMERIC(5,2),
      brix_4        NUMERIC(5,2), brix_5 NUMERIC(5,2),

      estado        VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
      realizado_por VARCHAR(150) NOT NULL,
      verificado_por VARCHAR(150) NOT NULL,
      observaciones TEXT,
      created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

const MEASUREMENT_FIELDS = [
  ...Array.from({ length: 5 }, (_, i) => `peso_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `longitud_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `amplitud_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `grosor_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `brix_${i + 1}`),
]

export const listarRegistros = async ({ fecha } = {}) => {
  if (fecha) {
    const { rows } = await query(
      'SELECT * FROM registros_porcionado WHERE fecha = $1 ORDER BY created_at DESC',
      [fecha],
    )
    return rows
  }
  const { rows } = await query(
    'SELECT * FROM registros_porcionado ORDER BY created_at DESC',
  )
  return rows
}

export const obtenerRegistro = async (id) => {
  const { rows } = await query(
    'SELECT * FROM registros_porcionado WHERE id = $1',
    [id],
  )
  if (!rows[0]) throw ApiError.notFound('Registro no encontrado')
  return rows[0]
}

export const crearRegistro = async (data) => {
  const {
    fecha, hora_inicio, hora_fin = null,
    cuarto,
    realizado_por, verificado_por,
    observaciones = null,
  } = data

  if (!fecha)          throw ApiError.badRequest('El campo fecha es obligatorio')
  if (!hora_inicio)    throw ApiError.badRequest('El campo hora_inicio es obligatorio')
  if (!cuarto)         throw ApiError.badRequest('El campo cuarto es obligatorio')
  if (!realizado_por)  throw ApiError.badRequest('El campo realizado_por es obligatorio')
  if (!verificado_por) throw ApiError.badRequest('El campo verificado_por es obligatorio')

  const lote   = calcularLote(fecha)
  const estado = calcularEstado(data)

  const measurements = MEASUREMENT_FIELDS.map((f) => data[f] ?? null)

  const cols   = ['fecha', 'lote', 'hora_inicio', 'hora_fin', 'cuarto', ...MEASUREMENT_FIELDS, 'estado', 'realizado_por', 'verificado_por', 'observaciones']
  const values = [fecha, lote, hora_inicio, hora_fin, cuarto, ...measurements, estado, realizado_por, verificado_por, observaciones]
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

  const { rows } = await query(
    `INSERT INTO registros_porcionado (${cols.join(', ')})
     VALUES (${placeholders})
     RETURNING *`,
    values,
  )
  return rows[0]
}

export const eliminarRegistro = async (id) => {
  const { rowCount } = await query(
    'DELETE FROM registros_porcionado WHERE id = $1',
    [id],
  )
  if (rowCount === 0) throw ApiError.notFound('Registro no encontrado')
  return true
}

export const eliminarTodosLosRegistros = async () => {
  await query('DELETE FROM registros_porcionado')
  return true
}
