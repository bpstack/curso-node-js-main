import { validateUser, validatePartialUser } from '../schemas/users.js'

export class UserController {
  constructor({ userModel }) {
    this.userModel = userModel
  }

  getAll = async (req, res) => {
    try {
      const users = await this.userModel.getAll()
      res.json(users)
    } catch (err) {
      console.error('❌ Error en UserController.getAll:', err.message)
      res
        .status(500)
        .json({ error: 'Error retrieving users', details: err.message })
    }
  }

  getById = async (req, res) => {
    const { id } = req.params
    try {
      const user = await this.userModel.getById(id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json(user)
    } catch (err) {
      console.error('❌ Error en UserController.getById:', err.message)
      res
        .status(500)
        .json({ error: 'Error retrieving user', details: err.message })
    }
  }

  create = async (req, res) => {
    const result = validateUser(req.body)
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: result.error.errors })
    }

    const input = result.data
    try {
      const user = await this.userModel.create(input)
      res.status(201).json(user)
    } catch (err) {
      console.error('❌ Error en UserController.create:', err.message)
      res
        .status(500)
        .json({ error: 'Error creating user', details: err.message })
    }
  }

  delete = async (req, res) => {
    const { id } = req.params
    try {
      const deleted = await this.userModel.delete(id)
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json({ message: 'User deleted' })
    } catch (err) {
      console.error('❌ Error en UserController.delete:', err.message)
      res
        .status(500)
        .json({ error: 'Error deleting user', details: err.message })
    }
  }

  update = async (req, res) => {
    const { id } = req.params

    const result = validatePartialUser(req.body)
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: result.error.errors })
    }

    const input = result.data
    try {
      const updatedUser = await this.userModel.update(id, input)
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json({ message: 'User updated' })
    } catch (err) {
      console.error('❌ Error en UserController.update:', err.message)
      res
        .status(500)
        .json({ error: 'Error updating user', details: err.message })
    }
  }
}
