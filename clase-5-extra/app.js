import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'

import { createMovieRouter } from './routes/movies.js'
import { MovieModel } from './models/local-file-system/movie.js'
import { UserModel } from './models/mysql/users.js'
import { createUserRouter } from './routes/users.js'

const app = express()

app.use(json())
app.use(corsMiddleware())

app.disable('x-powered-by')

// const ROUTER_TO_USE = 'users' // Cambia a 'movies' o 'users' según sea necesario

// if (ROUTER_TO_USE === 'users') {
//   app.use('/users', usersRouter)
// } else if (ROUTER_TO_USE === 'movies') {
//   app.use('/movies', moviesRouter)
// } else {
//   console.warn(
//     `Router "${ROUTER_TO_USE}" no está configurado. No se montará ningún router.`
//   )
// }

app.use('/movies', createMovieRouter({ movieModel: MovieModel }))
app.use('/users', createUserRouter({ userModel: UserModel }))

const PORT = process.env.PORT ?? 1234
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  // console.log(`Router activo: ${ROUTER_TO_USE}`) Por si quiero sólo activar uno
  console.log('Routers activos: /users y /movies')
})
