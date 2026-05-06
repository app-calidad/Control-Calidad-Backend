import * as lotesService from '../services/lotesService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// GET /api/lotes
export const getLotes = asyncHandler(async (_req, res) => {
  const lotes = await lotesService.listarLotes()
  res.status(200).json(lotes)
})

// GET /api/lotes/trazabilidad/:lote   ej. 19-2026
export const getTrazabilidad = asyncHandler(async (req, res) => {
  const data = await lotesService.obtenerTrazabilidad(req.params.lote)
  res.status(200).json(data)
})

// GET /api/lotes/trazabilidad/fecha/:fecha   ej. 2026-05-05
export const getTrazabilidadPorFecha = asyncHandler(async (req, res) => {
  const data = await lotesService.obtenerTrazabilidadPorFecha(req.params.fecha)
  res.status(200).json(data)
})
