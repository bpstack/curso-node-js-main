// routes/users.js
import { Router } from 'express'
import { UserController } from '../controllers/users.js'

export const usersRouter = Router()

usersRouter.get('/', UserController.getAll)
usersRouter.post('/', UserController.create)

usersRouter.get('/:id', UserController.getById)
usersRouter.delete('/:id', UserController.delete)
usersRouter.patch('/:id', UserController.update)
