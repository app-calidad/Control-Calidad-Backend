import * as prefreidoService from '../services/prefreidoService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// GET /api/prefreido/opciones
export const getOpciones = asyncHandler(async (_req, res) => {
  res.status(200).json(prefreidoService.OPCIONES)
})

// GET /api/prefreido?fecha=YYYY-MM-DD
export const getRegistros = asyncHandler(async (req, res) => {
  const { fecha } = req.query
  const registros = await prefreidoService.listarRegistros({ fecha })
  res.status(200).json(registros)
})

// GET /api/prefreido/:id
export const getRegistro = asyncHandler(async (req, res) => {
  const registro = await prefreidoService.obtenerRegistro(Number(req.params.id))
  res.status(200).json(registro)
})

// POST /api/prefreido
export const postRegistro = asyncHandler(async (req, res) => {
  const registro = await prefreidoService.crearRegistro(req.body)
  res.status(201).json(registro)
})

// DELETE /api/prefreido/all
export const deleteAll = asyncHandler(async (_req, res) => {
  await prefreidoService.eliminarTodosLosRegistros()
  res.status(200).json({ message: 'Todos los registros eliminados' })
})

// DELETE /api/prefreido/:id
export const deleteRegistro = asyncHandler(async (req, res) => {
  await prefreidoService.eliminarRegistro(Number(req.params.id))
  res.status(200).json({ message: 'Registro eliminado' })
})
