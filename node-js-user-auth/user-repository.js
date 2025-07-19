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
  static async create({ username, email, password, role }) {
    // 1. Hashear la contraseña (así la guardas segura)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // 2. Obtener un UUID nuevo (puedes usar UUID de MySQL o generar en JS)
    const [uuidResult] = await pool.query('SELECT UUID() as uuid')
    const uuid = uuidResult[0].uuid

    // 3. Fecha actual para created_at
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    try {
      // 4. Insertar el usuario en la tabla users
      await pool.query(
        `INSERT INTO users (id, name, email, password, created_at, is_active)
        VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, 1)`,
        [uuid, username, email, hashedPassword, createdAt]
      )

      // 5. Insertar el rol en la tabla user_role (si tienes roles)
      if (role) {
        const [roles] = await pool.query(
          'SELECT id FROM roles WHERE LOWER(name) = ?',
          [role.toLowerCase()]
        )
        if (roles.length === 0) throw new Error('Role not found')
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
        role: role || null,
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Error creating user')
    }
  }

  //   Notas:
  // Uso bcryptjs para el hash, es muy común y seguro. (tengo que instalarlo e importarlo)
  // Genero UUID en MySQL con UUID() y convierto a binario para id.
  // created_at se genera con JS para evitar problemas de zona horaria.
  // Inserto usuario y después el rol (si se envía).
  // Devuelvo datos básicos sin contraseña.
  // La columna password debería existir en tu tabla.

  static login({ username, password }) {}
  static logout({ username, password }) {}
  static findAll() {}
  static findById(id) {}
  static findByUsername(username) {}
  static update(id, { username, password }) {}
  static delete(id) {}
}
