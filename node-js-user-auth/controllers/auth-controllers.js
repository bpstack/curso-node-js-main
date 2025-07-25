// controllers/auth-controller.js
import { UserRepository } from '../repositories/user-repository.js'
import {
  validateUser,
  getValidationErrors,
} from '../validations/user-validation.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../services/tokenService.js'

export const login = async (req, res) => {
  try {
    // 1. Validar entrada
    const { username, password } = req.body
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
    // 3. Generar tokens
    const accessToken = generateAccessToken({
      id: user._id,
      username: user.username,
      role: user.role,
    })
    // 4. Generar refresh token
    const refreshToken = generateRefreshToken({ id: user._id })
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000,
    })
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    // 5. Eliminar la contraseña del objeto usuario
    // Esto es para no enviar la contraseña al cliente
    const { password: _, ...userWithoutPassword } = user.toObject?.() ?? user

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token: accessToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const register = async (req, res) => {
  const validationResult = validateUser(req.body)
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ errors: getValidationErrors(validationResult) })
  }

  const { username, email, password, role } = req.body // Asegúrate de que el rol sea uno permitido

  try {
    const user = await UserRepository.create({
      // Crear usuario
      username,
      email,
      password,
      role,
    })
    res.status(201).json({ success: true, user })
  } catch (error) {
    if (
      error.message.includes('duplicate') || //
      error.message.includes('UNIQUE')
    ) {
      return res.status(409).json({ error: 'Username already exists' })
    }
    if (process.env.NODE_ENV !== 'production') {
      // Solo mostrar detalles del error en desarrollo
      console.error('Registration error:', error)
      console.error(error)
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token no proporcionado' })
  }

  try {
    const payload = verifyToken(refreshToken)
    const newAccessToken = generateAccessToken({ id: payload.id })

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000,
    })

    res.status(200).json({ success: true, token: newAccessToken })
  } catch (error) {
    res.status(403).json({ error: 'Refresh token inválido o expirado' })
  }
}

export const logout = (req, res) => {
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

  res.status(200).json({ message: 'Sesión cerrada correctamente' })
}
