import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { calcularLote, calcularLoteW } from '../utils/loteUtils.js'

// ─── Crear tabla ─────────────────────────────────────────────────────────────

export const ensureLotesTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS lotes_produccion (
      id         SERIAL PRIMARY KEY,
      lote       VARCHAR(20) NOT NULL UNIQUE,   -- "19-2026"
      lote_w     VARCHAR(20) NOT NULL UNIQUE,   -- "W192026"
      fecha      DATE        NOT NULL,
      created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// ─── Obtener o crear lote ────────────────────────────────────────────────────

export const getOrCreateLote = async (fechaStr, createdById = null) => {
  const lote   = calcularLote(fechaStr)
  const lote_w = calcularLoteW(fechaStr)

  const { rows } = await query(
    `INSERT INTO lotes_produccion (lote, lote_w, fecha, created_by_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (lote) DO UPDATE SET fecha = EXCLUDED.fecha
     RETURNING *`,
    [lote, lote_w, fechaStr, createdById],
  )
  return rows[0]
}

// ─── Listar lotes ────────────────────────────────────────────────────────────

export const listarLotes = async () => {
  const { rows } = await query(
    'SELECT * FROM lotes_produccion ORDER BY fecha DESC',
  )
  return rows
}

// ─── Trazabilidad por lote (string "19-2026") ─────────────────────────────────

export const obtenerTrazabilidad = async (loteStr) => {
  const { rows } = await query(
    'SELECT * FROM v_trazabilidad_lote WHERE lote = $1',
    [loteStr],
  )
  if (!rows[0]) throw ApiError.notFound('Lote no encontrado')
  return rows[0]
}

// ─── Trazabilidad por fecha ───────────────────────────────────────────────────

export const obtenerTrazabilidadPorFecha = async (fechaStr) => {
  const lote = calcularLote(fechaStr)
  return obtenerTrazabilidad(lote)
}
