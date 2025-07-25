import { Validation } from './validations/user-validation.js'

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

import bcrypt from 'bcrypt' // Importar bcrypt para hashear contraseñas
import { SALT_ROUNDS } from './config/config.js' // Importar el número de rondas de sal desde la configuración
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // máximo conexiones abiertas
  queueLimit: 0, // sin límite en cola
})

export class UserRepository {
  static async create({ username, email, password }) {
    const DEFAULT_ROLE = 'recepcionist'

    // 1. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // 2. Obtener un UUID nuevo
    const [uuidResult] = await pool.query('SELECT UUID() as uuid')
    const uuid = uuidResult[0].uuid

    // 3. Fecha actual para created_at
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    try {
      // 4. Insertar el usuario en la tabla users
      await pool.query(
        `INSERT INTO users (id, username, email, password, created_at, is_active)
        VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, 1)`,
        [uuid, username, email, hashedPassword, createdAt]
      )

      // 5. Buscar el rol por defecto
      const [roles] = await pool.query(
        'SELECT id FROM roles WHERE LOWER(name) = ?',
        [DEFAULT_ROLE.toLowerCase()]
      )

      if (roles.length === 0) {
        console.warn(
          `Role '${DEFAULT_ROLE}' not found, no se asigna rol al usuario`
        )
      } else {
        const roleId = roles[0].id
        await pool.query(
          'INSERT INTO user_role (user_id, role_id) VALUES (UUID_TO_BIN(?), ?)',
          [uuid, roleId]
        )
      }

      // 6. Devolver usuario creado (sin password)
      return {
        id: uuid,
        username,
        email,
        created_at: createdAt,
        is_active: 1,
        role: DEFAULT_ROLE,
      }
    } catch (error) {
      console.error('Error creating user:', error)

      // Manejo seguro de errores:
      // Si es un error de duplicado (username/email único), informar claramente
      if (
        error.code === 'ER_DUP_ENTRY' || // MySQL error code para entrada duplicada
        error.message.includes('duplicate') ||
        error.message.includes('UNIQUE')
      ) {
        throw new Error('El nombre de usuario o email ya existe')
      }

      // Para otros errores, lanzar un error genérico para no filtrar detalles sensibles
      throw new Error('Error interno al crear usuario')
    }
  }

  static async login({ username, password }) {
    try {
      Validation.username(username)
      Validation.password(password)
    } catch (err) {
      throw new Error(err.message) // O un error personalizado con más contexto
    }

    const [rows] = await pool.query(
      `SELECT 
      BIN_TO_UUID(u.id) as id, 
      u.username, 
      u.email, 
      u.password, 
      u.is_active, 
      u.created_at, 
      r.name AS role
    FROM users u
    JOIN user_role ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.username = ?`,
      [username]
    )

    const user = rows[0]

    if (!user) {
      throw new Error('Usuario no encontrado') // O un error personalizado con más contexto
    }

    const isPasswordValid = await bcrypt.compare(password, user.password) // Compara la contraseña ingresada con la hasheada en la base de datos
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta')
    }

    // Devuelve el usuario sin contraseña
    const { password: _pw, ...userWithoutPassword } = user.toObject?.() ?? user // Si quiero añadir otro elemento que no quiero mostrar lo debo de añadir aqui junto a password
    return userWithoutPassword
  }

  static async getAll() {
    try {
      const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(u.id) as id,
        u.username,
        u.email,
        u.created_at,
        u.is_active,
        r.name AS role
      FROM users u
      LEFT JOIN user_role ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
    `)

      return rows
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      throw new Error('Error interno al obtener usuarios')
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          BIN_TO_UUID(u.id) AS id,
          u.username,
          u.email,
          u.created_at,
          u.is_active,
          r.name AS role
        FROM users u
        LEFT JOIN user_role ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = UUID_TO_BIN(?)
      `,
        [id]
      )

      return rows[0] || null
    } catch (error) {
      console.error('Error en getById:', error)
      throw new Error('Error interno al obtener usuario por ID')
    }
  }

  static async getByUsername(username) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          BIN_TO_UUID(u.id) AS id,
          u.username,
          u.email,
          u.created_at,
          u.is_active,
          r.name AS role
        FROM users u
        LEFT JOIN user_role ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.username = ?
      `,
        [username]
      )

      return rows[0] || null
    } catch (error) {
      console.error('Error en getByUsername:', error)
      throw new Error('Error interno al obtener usuario por username')
    }
  }

  static async getByRole(role) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          BIN_TO_UUID(u.id) AS id,
          u.username,
          u.email,
          u.created_at,
          u.is_active,
          r.name AS role
        FROM users u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE LOWER(r.name) = LOWER(?)
      `,
        [role]
      )

      return rows
    } catch (error) {
      console.error('Error en getByRole:', error)
      throw new Error('Error interno al obtener usuarios por rol')
    }
  }

  static async update(id, { username, email, role }) {
    const dbConnection = await pool.getConnection()
    try {
      await dbConnection.beginTransaction()

      // Actualizar username y email en tabla users
      await dbConnection.query(
        `
        UPDATE users
        SET username = ?, email = ?
        WHERE id = UUID_TO_BIN(?)
      `,
        [username, email, id]
      )

      // Actualizar o insertar rol en user_role (cuando el rol es null, no se actualiza)
      await dbConnection.query(
        `
        INSERT INTO user_role (user_id, role_id)
        VALUES (UUID_TO_BIN(?), (SELECT id FROM roles WHERE name = ?))
        ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
      `,
        [id, role]
      )

      await dbConnection.commit()
      return true
    } catch (error) {
      await dbConnection.rollback()
      console.error('Error en update:', error)
      throw new Error('Error interno al actualizar usuario')
    } finally {
      dbConnection.release()
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM users WHERE id = UUID_TO_BIN(?)',
        [id]
      )
      return result
    } catch (err) {
      throw new Error('Error al eliminar el usuario: ' + err.message)
    }
  }
}
