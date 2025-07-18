import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
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
  static create({ username, password }) {}
  static login({ username, password }) {}
  static logout({ username, password }) {}
  static findAll() {}
  static findById(id) {}
  static findByUsername(username) {}
  static update(id, { username, password }) {}
  static delete(id) {}
}
