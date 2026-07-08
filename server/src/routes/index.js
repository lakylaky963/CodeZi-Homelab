import { Router } from 'express'
import userRouter from './user.route.js'

const rootRouter = Router()

// Health check endpoint
rootRouter.get('/health', (req, res) => {
  console.log('📡 Health check requested')
  res.json({ ok: true })
})

rootRouter.use('/user', userRouter)

export default rootRouter
