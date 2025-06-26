const ditto = require('./pokemon/ditto.json')
const express = require('express')

const PORT = process.env.PORT ?? 1234

const app = express()
app.disable('x-powered-by')

app.get('/pokemon/ditto', (req, res) => {
  res.json(ditto)
})

app.post('/pokemon', (req, res) => {
  let body = ''

  // escuchar el evento data, esto tarda, por eso hay string + parse
  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    const data = JSON.parse(body)
    data.timestamp = Date.now()
    res.status(201).json(data)
  })
})

// Forma global de tratar toda la request del 404
// la última a la que va a llegar
app.use((req, res) => {
  res.status(404).send('<h1>meeh! 404</h1>')
})
app.listen(PORT, () => {
  console.log('server listening on port: http://localhost:1234')
})
