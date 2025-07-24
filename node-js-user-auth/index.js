import express from 'express' // Importar la dependencia, la herramienta que vamos a usar
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { PORT, SECRET_JWT_KEY } from './config/config.js' // Importar la configuración del puerto desde el archivo config.js. Esta manera es más moderna y permite usar variables de entorno fácilmente.

import { UserRepository } from './user-repository.js' // Importar el repositorio de usuarios
import {
  validateUser,
  getValidationErrors,
} from './validations/user-validation.js'

import { canDeleteUsers } from './middlewares/roleCheck.js'
import { authenticateToken } from './middlewares/authenticateToken.js'
import { authFromCookie } from './middlewares/authFromCookie.js'

const app = express() // crear la aplicación, una instancia de express
app.disable('x-powered-by')
// Deshabilitar el encabezado x-powered-by, que indica que la app está hecha con Express. Es una buena práctica de seguridad para no revelar información innecesaria.
app.use(cookieParser()) // Middleware para parsear cookies, así podemos acceder a las cookies en las peticiones. Esto es útil si usamos autenticación basada en cookies.
// Por ejemplo, si usamos JWT en cookies, este middleware nos permite acceder a ellas fácilmente.
app.use(express.json()) // Middleware para parsear el cuerpo de las peticiones como JSON, así podemos recibir datos en formato JSON en las peticiones POST. Es decir, el req.body es undefined, EXPRESS por defecto no lo "tramita".

app.use(authFromCookie)

app.set('view engine', 'ejs') // Configurar el motor de vistas, en este caso ejs

app.get('/', (req, res) => {
  const user = req.user

  if (user) {
    res.render('index', { isAuthenticated: true, username: user.username })
  } else {
    res.render('index', { isAuthenticated: false })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 1. Validar entrada
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' })
    }

    // 2. Autenticar usuario
    const user = await UserRepository.login({ username, password })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 3. Crear token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      SECRET_JWT_KEY,
      { expiresIn: '8h' }
    )
    // 4. Guardar el token en cookie
    res.cookie('access_token', token, {
      httpOnly: true, // Hace que la cookie sólo se pueda acceder desde el servidor, es decir, NO sea accesible desde JavaScript del lado del cliente
      secure: process.env.NODE_ENV === 'production', // sólo en https en producción
      sameSite: 'Strict', // Sólo desde el mismo sitio, mismo dominio, para evitar ataques CSRF
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    })

    // 4. Eliminar la contraseña del objeto usuario
    const { password: _, ...userWithoutPassword } = user.toObject?.() ?? user

    // 5. Devolver token + datos del usuario
    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/protected', (req, res) => {
  const user = req.user

  if (!user) {
    return res.status(403).send('Access not authorized')
  }

  res.render('protected', user) // Puedes acceder a user._id y user.username en la vista
})

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

app.post('/logout', (req, res) => {
  res.clearCookie('access_token')
  //jsontatus(200).json({ message: 'Logged out successfully' }) // Responder con éxito, indicando que se ha cerrado sesión (solo se puede hacer una respuesta por petición)
  // También podrías redirigir a la página de inicio o login
  res.redirect('/')
})

app.get('/users', async (req, res) => {
  try {
    const users = await UserRepository.getAll()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar users' })
  }
})

app.delete(
  '/users/:id',
  authenticateToken,
  canDeleteUsers,
  async (req, res) => {
    const userId = req.params.id
    try {
      await UserRepository.delete(userId)
      res.status(200).json({ message: 'Usuario eliminado correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar usuario' })
    }
  }
)

app.listen(PORT, () => {
  // Iniciar el servidor, escuchando en el puerto definido
  // El callback se ejecuta cuando el servidor está listo
  console.log(`Server is running on http://localhost:${PORT}`) // Mensaje de confirmación en la consola
})
