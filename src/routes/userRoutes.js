import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Every users route requires a valid admin token.
router.use(requireAuth)

// /export must be declared before /:id to avoid being captured by the param route.
router.get('/export', asyncHandler(userController.exportUsers))

router.get('/', asyncHandler(userController.getUsers))
router.post('/', asyncHandler(userController.createUser))
router.get('/:id', asyncHandler(userController.getUser))
router.put('/:id', asyncHandler(userController.updateUser))
router.delete('/:id', asyncHandler(userController.deleteUser))

export default router
