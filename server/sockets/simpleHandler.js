const SimpleGameEngine = require('../game/SimpleEngine');

class SimpleHandler {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.socketRoom = new Map();
    this.stateInterval = new Map();
  }

  handleConnection(socket) {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Create room for this player
    const roomId = `room_${Date.now()}`;
    const engine = new SimpleGameEngine();
    this.rooms.set(roomId, engine);
    this.socketRoom.set(socket.id, roomId);
    
    // Add player
    engine.addPlayer(socket.id);
    
    // Join room
    socket.join(roomId);
    
    // Send initial state
    socket.emit('game:joined', {
      roomId: roomId,
      playerId: socket.id,
      state: engine.getState()
    });
    
    // Send state updates every 100ms
    const interval = setInterval(() => {
      const state = engine.getState();
      socket.emit('game:state', state);
      
      // Check game over
      if (state.state === 'gameover') {
        socket.emit('game:over', {
          score: state.score,
          survivalTime: state.survivalTime
        });
        clearInterval(interval);
      }
    }, 100);
    
    this.stateInterval.set(socket.id, interval);
    
    // Handle input
    socket.on('player:input', (data) => {
      const roomId = this.socketRoom.get(socket.id);
      if (!roomId) return;
      
      const engine = this.rooms.get(roomId);
      if (!engine) return;
      
      engine.setKey(socket.id, data.key, data.pressed);
    });
    
    // Handle restart
    socket.on('game:restart', () => {
      const roomId = this.socketRoom.get(socket.id);
      if (!roomId) return;
      
      const engine = this.rooms.get(roomId);
      if (!engine) return;
      
      engine.startGame();
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      const roomId = this.socketRoom.get(socket.id);
      if (roomId) {
        const engine = this.rooms.get(roomId);
        if (engine) {
          engine.removePlayer(socket.id);
        }
        this.rooms.delete(roomId);
      }
      
      const interval = this.stateInterval.get(socket.id);
      if (interval) clearInterval(interval);
      
      this.socketRoom.delete(socket.id);
      this.stateInterval.delete(socket.id);
    });
  }
}

module.exports = SimpleHandler;