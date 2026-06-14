import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoConnect from './config/db.js' // Adjust paths if necessary to match your workspace
import rootRouter from './routes/index.js'
import pokerHandler from './sockets/pokerHandler.js'

const app = express()
const port = process.env.PORT || 8080

// Setup dynamic CORS array
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean)
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

// Middlewares
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// Main API Route
app.use('/api', rootRouter)

// Create Native HTTP Server and attach Socket.io
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
})

// Real-Time Socket Event Pipeline
io.on('connection', (socket) => {
  console.log(`🚀 Real-time poker player connected: ${socket.id}`)
  
  // Initialize Poker Game Logic
  pokerHandler(io, socket);

  socket.on('disconnect', () => {
    console.log(`❌ Player left: ${socket.id}`)
  })
})

// Error Handler Framework preserving CORS headers
app.use((err, req, res, next) => {
  if (!res.headersSent) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  }
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: err.message })
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

// Defensive, clean single-boot system
// const startServer = async () => {
//   try {
//     console.log("🔄 Initializing MongoDB Connection...")
//     await mongoConnect()
//     console.log("✅ MongoDB Connected Safely!")

//     httpServer.listen(port, () => {
//       console.log(`🚀 ========================================== 🚀`)
//       console.log(` CodeZi Real-Time Server active on port: ${port}`)
//       console.log(`🚀 ========================================== 🚀`)
//     })
//   } catch (error) {
//     console.error("❌ CRITICAL SERVER ENGINE BOOT FAULT:")
//     console.error(error)
//     process.exit(1)
//   }
// };

// startServer()

// Temporarily isolated boot layer to diagnose network binding
const startServer = async () => {
  // 1. Force the server to start listening on the network IMMEDIATELY
  httpServer.listen(port, () => {
    console.log(`🚀 ========================================== 🚀`)
    console.log(`🟢 CodeZi Real-Time Server FORCED ACTIVE on port: ${port}`)
    console.log(`🚀 ========================================== 🚀`)
  })

  // 2. Attempt database connection in the background without blocking the ports
  try {
    console.log("🔄 Initializing MongoDB Connection in background...")
    await mongoConnect()
    console.log("✅ MongoDB Connected Safely!")
  } catch (error) {
    console.error("❌ BACKGROUND DATABASE FAULT (Server is still running though):")
    console.error(error)
  }
}

startServer()