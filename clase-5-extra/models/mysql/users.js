/* eslint-disable camelcase */
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// const DEFAULT_CONFIG = {
//   host: 'localhost',
//   user: 'root',
//   port: 3306,
//   password: 'XXXXXX', // Aqui realmente tenía mi pw visible, no es buena práctica
//   database: 'hotel_db',
// }

// const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG
// const connection = await mysql.createConnection(connectionString)

// Configuración mínima sin valores por defecto de contraseña
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  password: process.env.DB_PASSWORD, // no poner valor por defecto aquí
  database: process.env.DB_NAME || 'hotel_db',
}

// Validar que la contraseña esté definida
if (!config.password) {
  throw new Error('La variable de entorno DB_PASSWORD no está definida')
}

const connection = await mysql.createConnection(config)

export class UserModel {
  static async getAll({ role } = {}) {
    if (role) {
      const [roles] = await connection.query(
        'SELECT id FROM roles WHERE LOWER(name) = ?;',
        [role.toLowerCase()]
      )

      if (roles.length === 0) return []

      const [{ id: roleId }] = roles

      const [users] = await connection.query(
        `SELECT BIN_TO_UUID(u.id) id, u.name, u.created_at, u.email, u.is_active, u.updated_at
        FROM users u
        JOIN user_role ur ON u.id = ur.user_id
        WHERE ur.role_id = ?;`,
        [roleId]
      )

      return users
    }

    const [users] = await connection.query(
      'SELECT BIN_TO_UUID(id) id, name, created_at, email, is_active, updated_at FROM users;'
    )
    return users
  }

  static async getById(id) {
    const [users] = await connection.query(
      `SELECT BIN_TO_UUID(id) id, name, created_at, email, is_active, updated_at
      FROM users WHERE id = UUID_TO_BIN(?);`,
      [id]
    )

    if (users.length === 0) return null
    return users[0]
  }

  static async create(input) {
    const { name, email, created_at, is_active = true, role } = input

    const [uuidResult] = await connection.query('SELECT UUID() uuid;')
    const [{ uuid }] = uuidResult

    // 🛠️ Preparamos una fecha válida o usamos la actual
    const createdAtValue =
      created_at && created_at.trim()
        ? new Date(created_at).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ')

    try {
      await connection.query(
        `INSERT INTO users (id, name, created_at, email, is_active)
          VALUES (UUID_TO_BIN(?), ?, ?, ?, ?);`,
        [uuid, name, createdAtValue, email, is_active]
      )

      const [roles] = await connection.query(
        'SELECT id FROM roles WHERE LOWER(name) = ?;',
        [role.toLowerCase()]
      )

      if (roles.length === 0) throw new Error('Role not found')

      const [{ id: roleId }] = roles

      await connection.query(
        'INSERT INTO user_role (user_id, role_id) VALUES (UUID_TO_BIN(?), ?);',
        [uuid, roleId]
      )

      const [user] = await connection.query(
        `SELECT BIN_TO_UUID(id) id, name, created_at, email, is_active, updated_at
          FROM users WHERE id = UUID_TO_BIN(?);`,
        [uuid]
      )

      return user[0]
    } catch (err) {
      console.error('DB error in create user:', err)
      throw new Error('Error creating user')
    }
  }

  static async delete(id) {
    await connection.query(
      'DELETE FROM user_role WHERE user_id = UUID_TO_BIN(?);',
      [id]
    )
    const [result] = await connection.query(
      'DELETE FROM users WHERE id = UUID_TO_BIN(?);',
      [id]
    )
    return result.affectedRows > 0
  }

  static async update(id, input) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key} = ?`)
      values.push(value)
    }

    const sql = `UPDATE users SET ${fields.join(
      ', '
    )} WHERE id = UUID_TO_BIN(?);`
    values.push(id)

    const [result] = await connection.query(sql, values)
    return result.affectedRows > 0
  }
}
