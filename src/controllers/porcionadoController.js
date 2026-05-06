import * as porcionadoService from '../services/porcionadoService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// GET /api/porcionado/opciones
export const getOpciones = asyncHandler(async (_req, res) => {
  res.status(200).json(porcionadoService.OPCIONES)
})

// GET /api/porcionado?fecha=YYYY-MM-DD
export const getRegistros = asyncHandler(async (req, res) => {
  const { fecha } = req.query
  const registros = await porcionadoService.listarRegistros({ fecha })
  res.status(200).json(registros)
})

// GET /api/porcionado/:id
export const getRegistro = asyncHandler(async (req, res) => {
  const registro = await porcionadoService.obtenerRegistro(Number(req.params.id))
  res.status(200).json(registro)
})

// POST /api/porcionado
export const postRegistro = asyncHandler(async (req, res) => {
  const registro = await porcionadoService.crearRegistro(req.body)
  res.status(201).json(registro)
})

// DELETE /api/porcionado/all
export const deleteAll = asyncHandler(async (_req, res) => {
  await porcionadoService.eliminarTodosLosRegistros()
  res.status(200).json({ message: 'Todos los registros eliminados' })
})

// DELETE /api/porcionado/:id
export const deleteRegistro = asyncHandler(async (req, res) => {
  await porcionadoService.eliminarRegistro(Number(req.params.id))
  res.status(200).json({ message: 'Registro eliminado' })
})
