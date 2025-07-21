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

  //   Notas:
  // Uso bcryptjs para el hash, es muy común y seguro. (tengo que instalarlo e importarlo)
  // Genero UUID en MySQL con UUID() y convierto a binario para id.
  // created_at se genera con JS para evitar problemas de zona horaria.
  // Inserto usuario y después el rol (si se envía).
  // Devuelvo datos básicos sin contraseña.
  // La columna password debería existir en tu tabla.

  static login({ username, password }) {}
  static logout({ username }) {}
  static findAll() {}
  static findById(id) {}
  static findByUsername(username) {}
  static update() {}
  static delete(id) {}
}

// ### 🔐 `login({ username, password })`

// * **Sí**, lo más común es usar `username` y `password` en el login.
// * Puedes validar así:

//   1. Buscar al usuario por `username`.
//   2. Comparar la contraseña con `bcrypt.compare()`.
//   3. Si es correcta, devolver los datos del usuario (sin contraseña) o generar un token (si usas JWT más adelante).

// ---

// ### 🔓 `logout({ username })` o `logout({ id })`

// * Si manejas **tokens (como JWT)**, el logout se hace del lado del cliente o invalidando el token. (los voy a usar JWT)
// * Si usas sesiones, puedes usar `id` o `username` según cómo identifiques al usuario.
// * **Recomendado:** usa `id`, es más específico y no cambia.

// ---

// ### 📋 `findAll()`

// * **Sí es útil.** Devuelve la lista de todos los usuarios.
// * Lo usarías, por ejemplo, en:

//   * Un panel de administración.
//   * Un dashboard para ver registros.
// * Normalmente devuelves: `id`, `username`, `email`, `created_at`, `is_active` (sin password).
// * Puedes incluir el `role` con un `JOIN`.

// ---

// ### 🔎 `findById(id)`

// * **Sí es necesario.**
// * Útil para:

//   * Obtener los detalles de un usuario específico.
//   * Mostrar su perfil.
// * Más seguro que usar `username` porque el `id` no cambia y es único.

// ---

// ### 🔎 `findByUsername(username)`

// * Útil **solo si necesitas buscar al usuario por nombre**.
// * Puede ser útil en:

//   * Búsqueda por parte de admins.
//   * Sistemas donde el `username` es clave principal.
// * Si no lo usas, puedes omitirlo, pero no está de más tenerlo. (esto es clave)

// ---

// ### ✏️ `update({ id, fields })`

// * **Sí, lo necesitas.**
// * Útil para actualizar:

//   * `username`
//   * `email`
//   * `role`
//   * `is_active`
//   * etc.

// **Forma flexible (recomendada):**

// ```js
// static async update(id, fields) {
//   const updates = []
//   const values = []

//   for (const [key, value] of Object.entries(fields)) {
//     updates.push(`${key} = ?`)
//     values.push(value)
//   }

//   values.push(id)

//   const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`
//   await pool.query(sql, values)
// }
// ```

// Así puedes hacer:

// ```js
// await UserRepository.update(userId, { username: 'nuevoNombre', email: 'nuevo@mail.com' })
// ```

// ---

// ### 🗑️ `delete(id)`

// * **Sí, lo necesitas.**
// * Borra un usuario por su `id`.
// * Ojo: puedes hacer soft delete (marcar `is_active = 0`) en vez de eliminar de verdad, si prefieres.

// Ejemplo básico:

// ```js
// static async delete(id) {
//   await pool.query('DELETE FROM users WHERE id = UUID_TO_BIN(?)', [id])
// }
// ```

// ---

// ¿Quieres que te escriba el código completo para alguna de estas funciones (`login`, `findAll`, `update`, etc.) ahora?
