// Este middleware verifica si hay un token de acceso en las cookies o en el encabezado Authorization, y si es válido, decodifica el usuario y lo agrega a req.user.
import { verifyToken } from '../services/tokenService.js'

export function authenticateToken(req, res, next) {
  const token =
    req.cookies.access_token || req.headers['authorization']?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }
}
