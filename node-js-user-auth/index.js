import express from 'express' // Importar la dependencia, la herramienta que vamos a usar
import cookieParser from 'cookie-parser'
import { PORT } from './config/config.js' // Importar la configuración del puerto desde el archivo config.js. Esta manera es más moderna y permite usar variables de entorno fácilmente.

import { UserRepository } from './user-repository.js' // Importar el repositorio de usuarios
import {
  validateUser,
  getValidationErrors,
} from './validations/user-validation.js'

//Middlewares
import { canDeleteUsers } from './middlewares/roleCheck.js'
import { authenticateToken } from './middlewares/authenticateToken.js'
import { authFromCookie } from './middlewares/authFromCookie.js'

//services/tokenService.js
import {
  generateAccessToken,
  generateRefreshToken,
} from './services/tokenService.js'

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

    // 3. token service
    const accessToken = generateAccessToken({
      id: user._id,
      username: user.username,
      role: user.role,
    })
    // refresh token, generarlo también
    const refreshToken = generateRefreshToken({ id: user._id })

    // 4. Guardar el token en cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Hace que la cookie sólo se pueda acceder desde el servidor, es decir, NO sea accesible desde JavaScript del lado del cliente
      secure: process.env.NODE_ENV === 'production', // sólo en https en producción
      sameSite: 'Strict', // Sólo desde el mismo sitio, mismo dominio, para evitar ataques CSRF
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    })
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    })

    // 4. Eliminar la contraseña del objeto usuario
    const { password: _, ...userWithoutPassword } = user.toObject?.() ?? user

    // 5. Devolver token + datos del usuario
    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token: accessToken,
      // refreshToken, // Si usas refresh token, puedes devolverlo aquí también
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token no proporcionado' })
  }

  try {
    const payload = verifyToken(refreshToken) // función de tokenService.js

    // Opcional: verifica que el usuario aún exista en la base de datos, etc.

    // Generar un nuevo access token
    const newAccessToken = generateAccessToken({
      id: payload.id,
      // Aquí podrías obtener más info del usuario si quieres (por ejemplo rol)
    })

    // Actualizar cookie de access token
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    })

    return res.status(200).json({ success: true, token: newAccessToken })
  } catch (error) {
    return res.status(403).json({ error: 'Refresh token inválido o expirado' })
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
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  })

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  })

  // Puedes devolver un mensaje o redirigir, como prefieras:
  return res.status(200).json({ message: 'Sesión cerrada correctamente' })
  // o: res.redirect('/')
})

app.get('/users', authenticateToken, canDeleteUsers, async (req, res) => {
  try {
    const users = await UserRepository.getAll()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar usuarios' })
  }
})

// Obtener usuarios por rol (solo admin)
// Esta ruta debe ir antes que la que tiene /users/:id para evitar conflictos de rutas
app.get(
  '/users/role/:role',
  authenticateToken,
  canDeleteUsers,
  async (req, res) => {
    try {
      const users = await UserRepository.getByRole(req.params.role)
      res.status(200).json(users)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener usuarios por rol' })
    }
  }
)

// Obtener usuario por ID (solo admin)
app.get('/users/:id', authenticateToken, canDeleteUsers, async (req, res) => {
  try {
    const user = await UserRepository.getById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

// Actualizar usuario (solo admin)
app.put('/users/:id', authenticateToken, canDeleteUsers, async (req, res) => {
  try {
    const { username, email, role } = req.body
    const updatedUser = await UserRepository.update(req.params.id, {
      username,
      email,
      role,
    })
    if (!updatedUser)
      return res.status(404).json({ error: 'Usuario no encontrado' })
    res.status(200).json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' })
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
