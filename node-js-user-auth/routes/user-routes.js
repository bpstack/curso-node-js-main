// routes/user-routes.js
import express from 'express'
import {
  getAllUsers,
  getUserById,
  getUsersByRole,
  updateUser,
  deleteUser,
} from '../controllers/user-controllers.js'

import { authenticateToken } from '../middlewares/authenticateToken.js'
import { canDeleteUsers } from '../middlewares/roleCheck.js'

const router = express.Router()

// Proteger todas las rutas con auth + permisos de admin
router.use(authenticateToken, canDeleteUsers) // aunque se llame canDeleteUsers, es referida a la autorización general de usuarios, gestionar, modificar y eliminar usuarios.

router.get('/', getAllUsers)
router.get('/role/:role', getUsersByRole) // importante que esté antes de /:id porque si no, se confunde con el id numérico
router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router
