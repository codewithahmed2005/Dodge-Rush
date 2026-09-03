const GameRoom = require('../game/GameRoom');
const logger = require('../utils/logger');

class GameHandler {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.socketRooms = new Map();
    
    setInterval(() => this.cleanupInactiveRooms(), 60000);
  }

  handleConnection(socket) {
    logger.info(`🔌 Client connected: ${socket.id}`);
    
    const roomId = `room_${socket.id.substring(0, 8)}`;
    this.createRoom(roomId);
    this.joinRoom(socket, roomId);
    this.setupEventHandlers(socket);
    this.sendGameState(socket);
  }

  createRoom(roomId) {
    if (this.rooms.has(roomId)) return false;
    
    const room = new GameRoom(roomId);
    this.rooms.set(roomId, room);
    logger.info(`🏠 Room created: ${roomId}`);
    return true;
  }

  joinRoom(socket, roomId) {
    if (!this.rooms.has(roomId)) return false;
    
    const room = this.rooms.get(roomId);
    if (!room.isActive) return false;
    
    const playerId = room.addPlayer(socket.id);
    if (!playerId) return false;
    
    this.socketRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('game:joined', {
      roomId,
      playerId,
      state: room.getState(),
    });
    
    logger.info(`👤 Player ${playerId} joined room ${roomId}`);
    return true;
  }

  setupEventHandlers(socket) {
    socket.on('player:input', (data) => {
      this.handlePlayerInput(socket, data);
    });
    
    socket.on('game:restart', () => {
      this.handleGameRestart(socket);
    });
    
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  handlePlayerInput(socket, data) {
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    if (!data || typeof data !== 'object') {
      socket.emit('game:error', { message: 'Invalid input format' });
      return;
    }
    
    const { key, pressed } = data;
    if (typeof key !== 'string' || typeof pressed !== 'boolean') {
      socket.emit('game:error', { message: 'Invalid input values' });
      return;
    }
    
    if (!['left', 'right'].includes(key)) return;
    
    room.handleInput(socket.id, { key, pressed });
  }

  handleGameRestart(socket) {
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    logger.info(`🔄 Game restarted in room ${roomId}`);
    room.engine.startGame();
  }

  handleDisconnect(socket) {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
    
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.removePlayer(socket.id);
    this.socketRooms.delete(socket.id);
    
    if (room.players.size === 0) {
      room.isActive = false;
      logger.info(`🏠 Room ${roomId} is now empty`);
    }
  }

  sendGameState(socket) {
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const state = room.getState();
    socket.emit('game:state', state);
  }

  broadcastGameState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const state = room.getState();
    this.io.to(roomId).emit('game:state', state);
  }

  broadcastGameOver(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const state = room.getState();
    this.io.to(roomId).emit('game:over', {
      score: state.score,
      survivalTime: state.survivalTime,
    });
  }

  cleanupInactiveRooms() {
    const now = Date.now();
    const inactiveRooms = [];
    
    for (const [roomId, room] of this.rooms) {
      if (!room.isActive || room.players.size === 0) {
        if (now - room.createdAt > 300000) {
          inactiveRooms.push(roomId);
        }
      }
    }
    
    for (const roomId of inactiveRooms) {
      const room = this.rooms.get(roomId);
      room.cleanup();
      this.rooms.delete(roomId);
      logger.info(`🧹 Removed inactive room: ${roomId}`);
    }
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return {
      roomId: room.roomId,
      playerCount: room.players.size,
      state: room.engine.state,
      createdAt: room.createdAt,
      isActive: room.isActive,
    };
  }
}

module.exports = GameHandler;