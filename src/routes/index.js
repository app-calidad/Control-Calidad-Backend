import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import porcionadoRoutes from './porcionadoRoutes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/porcionado', porcionadoRoutes)

export default router
