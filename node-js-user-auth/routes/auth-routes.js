// routes/auth-routes.js
import express from 'express'
import {
  login,
  register,
  refreshToken,
  logout,
} from '../controllers/auth-controllers.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/refresh-token', refreshToken)
router.post('/logout', logout)

export default router
