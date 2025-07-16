import { UserModel } from '../models/mysql/users.js'
import { validateUser, validatePartialUser } from '../schemas/users.js'

export class UserController {
  static async getAll(req, res) {
    try {
      const users = await UserModel.getAll()
      res.json(users)
    } catch (err) {
      console.error('❌ Error en UserController.getAll:', err.message)
      res
        .status(500)
        .json({ error: 'Error retrieving users', details: err.message })
    }
  }

  static async getById(req, res) {
    const { id } = req.params
    const user = await UserModel.getById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  }

  static async create(req, res) {
    // Validamos el cuerpo de la petición
    const result = validateUser(req.body)
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: result.error.errors })
    }

    const input = result.data
    try {
      const user = await UserModel.create(input)
      res.status(201).json(user)
    } catch (err) {
      console.error('❌ Error creating user:', err.message)
      res
        .status(500)
        .json({ error: 'Error creating user', details: err.message })
    }
  }

  static async delete(req, res) {
    const { id } = req.params
    const deleted = await UserModel.delete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted' })
  }

  static async update(req, res) {
    const { id } = req.params

    // Validación parcial para update
    const result = validatePartialUser(req.body)
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: result.error.errors })
    }

    const input = result.data
    try {
      const updatedUser = await UserModel.update(id, input)
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json({ message: 'User updated' })
    } catch (err) {
      console.error('❌ Error updating user:', err.message)
      res
        .status(500)
        .json({ error: 'Error updating user', details: err.message })
    }
  }
}
