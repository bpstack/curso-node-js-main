/* eslint-disable comma-dangle */
const express = require('express') // require -> CommonJS
const crypto = require('node:crypto')
const movies = require('./movies.json')
const cors = require('cors')

const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors())
app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.json({ message: 'Hola Mundo' })
})

// Todos los recursos que sean Movies se identifican con /movies
app.get('/movies', (req, res) => {
  const { genre, search } = req.query

  let filteredMovies = movies

  if (genre) {
    filteredMovies = filteredMovies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    )
  }

  if (search) {
    filteredMovies = filteredMovies.filter((movie) =>
      movie.title.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (filteredMovies.length === 0) {
    return res
      .status(404)
      .json({ error: 'So sorry sir, we can not find that movies dude!' })
  }

  res.json(filteredMovies)
})

// Pedimos una pelicula en concreto por id
app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

// POST
app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data, // - no es lo mismo que result.body MAL
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log('server listening on port: http://localhost:1234')
})
