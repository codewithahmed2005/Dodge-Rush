const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const SimpleHandler = require('./sockets/simpleHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', credentials: true }
});

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket handler
const handler = new SimpleHandler(io);
io.on('connection', (socket) => handler.handleConnection(socket));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Phase 3: Server-authoritative game`);
  console.log(`🔌 Socket.IO ready`);
});