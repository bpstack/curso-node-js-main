import express from 'express' // Importar la dependencia, la herramienta que vamos a usar
import { PORT } from './config/config.js' // Importar la configuración del puerto desde el archivo config.js. Esta manera es más moderna y permite usar variables de entorno fácilmente
const app = express() // crear la aplicación, una instancia de express
import { UserRepository } from './user-repository.js' // Importar el repositorio de usuarios
import {
  validateUser,
  getValidationErrors,
} from './validations/user-validation.js'

import { canDeleteUsers } from './middlewares/roleCheck.js'
import { tr } from 'zod/v4/locales'

// const PORT = process.env.PORT ?? 3000 // Definir el puerto en el que va a correr la aplicación, si no hay una variable de entorno PORT, usar 3000. // Lo hemos comentado porque ahora usamos config.js e importamos el puerto desde allí

app.disable('x-powered-by')
// Deshabilitar el encabezado x-powered-by, que indica que la app está hecha con Express. Es una buena práctica de seguridad para no revelar información innecesaria.

app.use(express.json()) // Middleware para parsear el cuerpo de las peticiones como JSON, así podemos recibir datos en formato JSON en las peticiones POST. Es decir, el req.body es undefined, EXPRESS por defecto no lo "tramita".

app.set('view engine', 'ejs') // Configurar el motor de vistas, en este caso ejs

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body // Extraer username y password del cuerpo de la petición

  try {
    // 1. Validar entrada
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' })
    }

    // 2. Autenticar usuario (asumiendo que login devuelve null si falla)
    const user = await UserRepository.login({ username, password })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 3. Eliminar la contraseña antes de responder
    const { password: _, ...userWithoutPassword } = user

    // 4. Responder con éxito
    return res.status(200).json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('protected', (req, res) => {}) // Ruta protegida, que requiere autenticación

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

app.get('/users', async (req, res) => {
  try {
    const users = await UserRepository.getAll()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar users' })
  }
})

app.delete('/users/:id', canDeleteUsers, async (req, res) => {
  const userId = req.params.id
  try {
    await UserRepository.delete(userId)
    res.status(200).json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})

app.listen(PORT, () => {
  // Iniciar el servidor, escuchando en el puerto definido
  // El callback se ejecuta cuando el servidor está listo
  console.log(`Server is running on http://localhost:${PORT}`) // Mensaje de confirmación en la consola
})
