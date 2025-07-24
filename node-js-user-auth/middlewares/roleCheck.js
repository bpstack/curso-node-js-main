export function canDeleteUsers(req, res, next) {
  console.log('User en roleCheck:', req.user)

  if (
    req.user?.role &&
    ['General Manager', 'Front office Manager'].includes(req.user.role)
  ) {
    next()
  } else {
    res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' })
  }
}
