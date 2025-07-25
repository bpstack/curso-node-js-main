import express from 'express'
import cookieParser from 'cookie-parser'
import { PORT } from './config/config.js'

import authRoutes from './routes/auth-routes.js'
import userRoutes from './routes/user-routes.js'

import { authFromCookie } from './middlewares/authFromCookie.js'

const app = express()

app.disable('x-powered-by') // Deshabilitar el encabezado x-powered-by para mayor seguridad
app.use(cookieParser()) // Middleware para parsear cookies y esto permite acceder a req.cookies
app.use(express.json()) // Middleware para parsear el cuerpo de las solicitudes JSON
app.use(authFromCookie) // Middleware para autenticar desde cookies

app.set('view engine', 'ejs')

// Vista principal
app.get('/', (req, res) => {
  const user = req.user
  if (user) {
    res.render('index', { isAuthenticated: true, username: user.username })
  } else {
    res.render('index', { isAuthenticated: false })
  }
})

// Vista protegida
app.get('/protected', (req, res) => {
  const user = req.user
  if (!user) return res.status(403).send('Access not authorized')
  res.render('protected', user)
})

// Rutas de autenticación (login, register, logout, refresh)
app.use('/auth', authRoutes)

// Rutas de gestión de usuarios (solo admins)
app.use('/users', userRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
