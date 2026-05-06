import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import {
  getOpciones,
  getRegistros,
  getRegistro,
  postRegistro,
  deleteAll,
  deleteRegistro,
} from '../controllers/prefreidoController.js'

const router = Router()

router.use(requireAuth)

router.get('/opciones', getOpciones)
router.get('/',         getRegistros)
router.get('/:id',      getRegistro)
router.post('/',        postRegistro)
router.delete('/all',   deleteAll)
router.delete('/:id',   deleteRegistro)

export default router
