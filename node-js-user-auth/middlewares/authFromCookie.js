import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config/config.js'

export function authFromCookie(req, res, next) {
  const token = req.cookies.access_token
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY) // decoded significa que el token es válido y contiene la información del usuario
      req.user = decoded // Guardamos el usuario decodificado en req.user para que esté disponible en las siguientes rutas
      // Esto nos permite acceder a req.user.id, req.user.username, etc. en las
    } catch (err) {
      // Token inválido o expirado, ignoramos
    }
  }
  next()
}
