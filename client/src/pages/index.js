import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());

// Wrap Express app in HTTP Server
const httpServer = createServer(app);

// Initialize Socket.io attached to the HTTP server
const io = new Server(httpServer, {
  allowEIO3: true,
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io logic (Add your game room handlers here)
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Real-time Poker Gateway active on port ${PORT}`);
});
// This file should contain your client-side React application's entry point.
// For example:
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from '../App'; // Assuming App.jsx is in client/src/App.jsx
// ReactDOM.createRoot(document.getElementById('root')).render(<App />);