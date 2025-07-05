const express = require('express') // require -> CommonJS

const app = express()
app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.json({ message: 'Hola Mundo' })
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log('server listening on port: http://localhost:1234')
})
