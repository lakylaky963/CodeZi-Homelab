import { Router } from 'express'
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from '../controllers/user.controller.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const userRouter = Router()

// 15 user creations per 15 minutes per client IP
const createUserLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 15 })

userRouter.get('/', getUsers)
userRouter.get('/:id', getUser)
userRouter.post('/', createUserLimiter, createUser)
userRouter.delete('/:id', requireAdmin, deleteUser)
// here we use patch instead of put
// patch allows modification of fields whereas put overrides the object entirely
userRouter.patch('/:id', requireAdmin, updateUser)

export default userRouter
