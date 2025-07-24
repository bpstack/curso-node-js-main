import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config/config.js'

export function authenticateToken(req, res, next) {
  const token =
    req.cookies.access_token || req.headers['authorization']?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  jwt.verify(token, SECRET_JWT_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' })
    }

    console.log('Token decodificado:', decoded) // <-- Aquí ves qué trae el token

    req.user = decoded
    next()
  })
}
