import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import {
  getLotes,
  getTrazabilidad,
  getTrazabilidadPorFecha,
} from '../controllers/lotesController.js'

const router = Router()

router.use(requireAuth)

router.get('/',                         getLotes)
router.get('/trazabilidad/:lote',       getTrazabilidad)
router.get('/trazabilidad/fecha/:fecha', getTrazabilidadPorFecha)

export default router
