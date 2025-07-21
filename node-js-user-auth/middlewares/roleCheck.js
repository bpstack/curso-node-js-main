export function canDeleteUsers(req, res, next) {
  const allowedRoles = ['1', '2'] // General Manager y Front office Manager

  if (req.user && allowedRoles.includes(req.user.role.toString())) {
    next()
  } else {
    res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' })
  }
}
