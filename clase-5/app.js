import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'

import { moviesRouter } from './routes/movies.js'
import { usersRouter } from './routes/users.js'

const app = express()

app.use(json())
app.use(corsMiddleware())

app.disable('x-powered-by')

const ROUTER_TO_USE = 'users' // Cambia a 'movies' o 'users' según sea necesario

if (ROUTER_TO_USE === 'users') {
  app.use('/users', usersRouter)
} else if (ROUTER_TO_USE === 'movies') {
  app.use('/movies', moviesRouter)
} else {
  console.warn(
    `Router "${ROUTER_TO_USE}" no está configurado. No se montará ningún router.`
  )
}

const PORT = process.env.PORT ?? 1234
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log(`Router activo: ${ROUTER_TO_USE}`)
})
