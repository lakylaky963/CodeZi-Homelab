import { Router } from 'express'
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from '../controllers/user.controller.js'

const userRouter = Router()

userRouter.get('/', getUsers)
userRouter.get('/:id', getUser)
userRouter.post('/', createUser)
userRouter.delete('/:id', deleteUser)
// here we use patch instead of put
// patch allows modification of fields whereas put overrides the object entirely
userRouter.patch('/:id', updateUser)

export default userRouter
