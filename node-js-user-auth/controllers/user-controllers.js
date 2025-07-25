// controllers/user-controller.js
import { UserRepository } from '../repositories/user-repository.js'

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserRepository.getAll()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar usuarios' })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await UserRepository.getById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

export const getUsersByRole = async (req, res) => {
  try {
    const users = await UserRepository.getByRole(req.params.role)
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios por rol' })
  }
}

export const updateUser = async (req, res) => {
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
}

export const deleteUser = async (req, res) => {
  try {
    await UserRepository.delete(req.params.id)
    res.status(200).json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
}
