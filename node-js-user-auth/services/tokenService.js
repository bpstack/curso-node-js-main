// services/tokenService.js
import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config/config.js'

const ACCESS_TOKEN_EXPIRY = '8h'
const REFRESH_TOKEN_EXPIRY = '7d'

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_JWT_KEY,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, SECRET_JWT_KEY, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET_JWT_KEY)
}
