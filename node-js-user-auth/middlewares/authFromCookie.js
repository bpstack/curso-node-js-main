// Este middleware verifica si hay un token de acceso en las cookies y, si es válido, decodifica el usuario y lo agrega a req.user.
import { verifyToken } from '../services/tokenService.js'

export function authFromCookie(req, res, next) {
  const token = req.cookies.access_token
  if (token) {
    try {
      const decoded = verifyToken(token) // decoded significa que el token es válido y contiene la información del usuario
      req.user = decoded // Guardamos el usuario decodificado en req.user para que esté disponible en las siguientes rutas
      // Esto nos permite acceder a req.user.id, req.user.username, etc. en las
    } catch (err) {
      // Token inválido o expirado, ignoramos
    }
  }
  next()
}
