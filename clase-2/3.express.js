const ditto = require('./pokemon/ditto.json')
const express = require('express')

const PORT = process.env.PORT ?? 1234

const app = express()
app.disable('x-powered-by')

app.use(express.json())
// app.use((req, res, next) => {
//   // trackear la request a la base de datos
//   // revisar si el usuario tiene cookies
//   // Vemos un ejemplo:
//   if (req.method !== 'POST') return next()
//   if (req.headers['content-type'] !== 'application/json') return next()
//   // Aquí sólo llegan request que son POST y header content json, q realmente es
//   // la que hemos hecho más adelante y hemos simplificado el code req.body
//   let body = ''
//   req.on('data', chunk => {
//     body += chunk.toString()
//   })

//   req.on('end', () => {
//     const data = JSON.parse(body)
//     data.timestamp = Date.now()
//     // res.status(201).json(data) no podemos responder
//     req.body = data// mutamos la request y meter la información en el req.body (cambiamos el body, esto se hace constantemente)
//     next()
//   })
// })

app.get('/pokemon/ditto', (req, res) => {
  res.json(ditto)
})

app.post('/pokemon', (req, res) => {
  // req.body deberíamos guardar en bbdd (bases de datos)
  res.status(201).json(req.body)// la req.body es lo que hemos tratado en el middleware
})

// Forma global de tratar toda la request del 404
// la última a la que va a llegar
app.use((req, res) => {
  res.status(404).send('<h1>meeh! 404</h1>')
})
app.listen(PORT, () => {
  console.log('server listening on port: http://localhost:1234')
})
