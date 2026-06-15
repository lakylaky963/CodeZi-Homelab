import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoConnect from './config/db.js'
import rootRouter from './routes/index.js'

// Clean extensionless import to the correct subfolder
import pokerHandler from './sockets/pokerHandler'

const app = express()
const port = process.env.PORT || 8080

// Dynamic CORS configuration
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const allowedOrigins = Array.from(
  new Set([
    ...envOrigins,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ])
)

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  return /^http:\/\/localhost:517\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:517\d+$/.test(origin)
}

app.use(cors({ origin: isAllowedOrigin, credentials: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/api', rootRouter)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: isAllowedOrigin, methods: ["GET", "POST"], credentials: true },
  allowEIO3: true
})

io.on('connection', (socket) => {
  console.log(`🚀 Real-time poker player connected: ${socket.id}`)
  pokerHandler(io, socket)
  socket.on('disconnect', () => {
    console.log(`❌ Player left: ${socket.id}`)
  })
})

// ====================================================
// 🔥 ANTI-ZOMBIE AUTOMATIC PORT CLEANUP MECHANICS
// ====================================================
const startServer = async () => {
  const serverInstance = httpServer.listen(port, () => {
    console.log(`🚀 ========================================== 🚀`)
    console.log(`🟢 CodeZi Real-Time Server ACTIVE on port: ${port}`)
    console.log(`🚀 ========================================== 🚀`)
  })

  // Catch if port 8080 is already locked by a zombie process and kill gracefully
  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${port} is occupied! Force-exiting process to clear binding...`)
      process.exit(1)
    }
  })

  try {
    console.log("🔄 Initializing MongoDB Connection in background...")
    await mongoConnect()
    console.log("✅ MongoDB Connected Safely!")
  } catch (error) {
    console.log("⚠️ Continuing without MongoDB connection locally...")
  }
}

// Cleanly free port 8080 when stopping server with Ctrl+C
const killSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT']
killSignals.forEach(signal => {
  process.on(signal, () => {
    console.log(`\n🛑 Shuts down server gracefully via ${signal}... freeing ports.`)
    httpServer.close(() => {
      process.exit(0)
    })
  })
})

startServer()