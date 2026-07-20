import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoConnect from './config/db.js'
import rootRouter from './routes/index.js'
import requestLogger from './middleware/requestLogger.js'

// Clean extensionless import to the correct subfolder
import pokerHandler from './sockets/pokerHandler.js';
import startSessionSweeper from './services/sessionSweeper.js'

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
    'https://codezi.vercel.app',
  ])
)

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true
  return /^http:\/\/localhost:517\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:517\d+$/.test(origin)
}

app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)), credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// Simple request logging to help debug connection resets
app.use(requestLogger)

// Health check endpoint for Vercel & monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('/api', rootRouter)

const httpServer = createServer(app)

httpServer.on('request', (req) => {
  console.log('HTTP SERVER REQUEST', req.method, req.url)
})

const io = new Server(httpServer, {
  cors: { origin: isAllowedOrigin, methods: ["GET", "POST"], credentials: true },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  }
})

// Ping endpoint for client to test connection (after io is defined)
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong', 
    serverTime: new Date().toISOString(),
    connections: io.engine.clientsCount 
  })
})

io.on('connection', (socket) => {
  console.log(`✅ Real-time poker player connected: ${socket.id}`)
  console.log(`   Connected clients: ${io.engine.clientsCount}`)
  
  pokerHandler(io, socket)
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Player left: ${socket.id} - Reason: ${reason}`)
    console.log(`   Remaining clients: ${io.engine.clientsCount}`)
  })

  socket.on('error', (error) => {
    console.error(`🔴 Socket error from ${socket.id}:`, error)
  })
})

io.on('connect_error', (error) => {
  console.error('🔴 Socket.IO connection error:', error)
})

// ====================================================
// 🔥 ANTI-ZOMBIE AUTOMATIC PORT CLEANUP MECHANICS
// ====================================================
const startServer = async () => {
  let dbConnected = false

  try {
    console.log('🔄 Initializing MongoDB connection before server startup...')
    dbConnected = await mongoConnect()
    console.log(`✅ MongoDB connection status: ${dbConnected ? 'connected' : 'not connected'}`)
  } catch (error) {
    console.error('⚠️ MongoDB initialization failed:', error)
    console.log('🚫 Continuing without MongoDB connection.')
  }

  const serverInstance = httpServer.listen(port, () => {
    console.log(`🚀 ========================================== 🚀`)
    console.log(`🟢 CodeZi Real-Time Server ACTIVE on port: ${port}`)
    console.log(`🟢 MongoDB connected: ${dbConnected}`)
    console.log(`🚀 ========================================== 🚀`)
    if (dbConnected) startSessionSweeper(io)
  })

  // Catch if port 8080 is already locked by a zombie process and kill gracefully
  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${port} is occupied! Force-exiting process to clear binding...`)
      process.exit(1)
    }
  })
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

// Express error handler (should be last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error in request handler:', err)
  try {
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' })
  } catch (e) {
    // ignore
  }
})

// Process-level handlers to avoid silent crashes
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err)
})

startServer()