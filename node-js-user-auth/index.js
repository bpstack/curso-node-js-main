import express from 'express' // Importar la dependencia, la herramienta que vamos a usar
import { PORT } from './config/config.js' // Importar la configuración del puerto desde el archivo config.js. Esta manera es más moderna y permite usar variables de entorno fácilmente
const app = express() // crear la aplicación, una instancia de express
import { UserRepository } from './user-repository.js' // Importar el repositorio de usuarios
import {
  validateUser,
  getValidationErrors,
} from './validations/user-validation.js'

// const PORT = process.env.PORT ?? 3000 // Definir el puerto en el que va a correr la aplicación, si no hay una variable de entorno PORT, usar 3000. // Lo hemos comentado porque ahora usamos config.js e importamos el puerto desde allí

app.use(express.json()) // Middleware para parsear el cuerpo de las peticiones como JSON, así podemos recibir datos en formato JSON en las peticiones POST. Es decir, el req.body es undefined, EXPRESS por defecto no lo "tramita".

app.set('view engine', 'ejs') // Configurar el motor de vistas, en este caso ejs

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/login', (req, res) => {})

app.post('/register', async (req, res) => {
  // 1. Validar entrada
  const validationResult = validateUser(req.body)
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ errors: getValidationErrors(validationResult) })
  }

  const { username, email, password, role } = req.body

  try {
    // 2. Crear usuario
    const user = await UserRepository.create({
      username,
      email,
      password,
      role,
    })

    // 3. Responder con éxito, sin la password
    return res.status(201).json({ success: true, user })
  } catch (error) {
    // 4. Manejar errores (como username duplicado)
    if (
      error.message.includes('duplicate') ||
      error.message.includes('UNIQUE')
    ) {
      return res.status(409).json({ error: 'Username already exists' })
    }
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/logout', (req, res) => {})

app.get('protected', (req, res) => {}) // Ruta protegida, que requiere autenticación

app.listen(PORT, () => {
  // Iniciar el servidor, escuchando en el puerto definido
  // El callback se ejecuta cuando el servidor está listo
  console.log(`Server is running on http://localhost:${PORT}`) // Mensaje de confirmación en la consola
})
