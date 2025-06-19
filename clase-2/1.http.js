const http = require('node:http') // protocolo HTTP

const desiredPort = process.env.PORT ?? 1234

const processRequest = (req, res) => { // esta funcion de recibir la request y procesarla se la podemos pasar al servidor que vamos a crear
  console.log('request received', req.url) // esto de req.url es que cada vez que haga una request obtenemos la siguiente linea
  res.end('Hola mundo')
}
const server = http.createServer(processRequest)

server.listen(desiredPort, () => {
  console.log(`server listening on port http://localhost:${desiredPort}`)
})
