import express from 'express' // Importar la dependencia, la herramienta que vamos a usar
import { PORT } from './config/config.js' // Importar la configuración del puerto desde el archivo config.js. Esta manera es más moderna y permite usar variables de entorno fácilmente
const app = express() // crear la aplicación, una instancia de express

// const PORT = process.env.PORT ?? 3000 // Definir el puerto en el que va a correr la aplicación, si no hay una variable de entorno PORT, usar 3000. // Lo hemos comentado porque ahora usamos config.js e importamos el puerto desde allí

app.get('/', (req, res) => {
  // Definir una ruta, en este caso la raíz del sitio
  // req es el objeto de la petición, res es el objeto de la respuesta
  res.send('Hello Bori') // Enviar una respuesta al cliente, en este caso un texto
})

app.post('/login', (req, res) => {})

app.post('/register', (req, res) => {})

app.post('/logout', (req, res) => {})

app.get('protected', (req, res) => {}) // Ruta protegida, que requiere autenticación

app.listen(PORT, () => {
  // Iniciar el servidor, escuchando en el puerto definido
  // El callback se ejecuta cuando el servidor está listo
  console.log(`Server is running on http://localhost:${PORT}`) // Mensaje de confirmación en la consola
})
