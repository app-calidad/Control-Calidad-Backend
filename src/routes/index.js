import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import porcionadoRoutes from './porcionadoRoutes.js'
import prefreidoRoutes from './prefreidoRoutes.js'
import lotesRoutes from './lotesRoutes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/porcionado', porcionadoRoutes)
router.use('/prefreido', prefreidoRoutes)
router.use('/lotes', lotesRoutes)

export default router
