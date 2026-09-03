const GameEngine = require('./GameEngine');

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.engine = new GameEngine(roomId);
    this.players = new Map();
    this.createdAt = Date.now();
    this.isActive = true;
  }

  addPlayer(socketId, playerData = {}) {
    if (this.players.has(socketId)) return false;
    
    const playerId = `player_${socketId.substring(0, 8)}`;
    this.players.set(socketId, playerId);
    this.engine.addPlayer(playerId, playerData);
    
    // AUTO-START: Start game when first player joins
    if (this.engine.state === 'waiting' && this.players.size > 0) {
      console.log(`🚀 Auto-starting game in room ${this.roomId}`);
      this.engine.startGame();
    }
    
    return playerId;
  }

  removePlayer(socketId) {
    if (!this.players.has(socketId)) return false;
    
    const playerId = this.players.get(socketId);
    this.players.delete(socketId);
    this.engine.removePlayer(playerId);
    
    if (this.players.size === 0) {
      this.isActive = false;
    }
    
    return true;
  }

  handleInput(socketId, data) {
    if (!this.players.has(socketId)) return false;
    
    const playerId = this.players.get(socketId);
    const { key, pressed } = data;
    
    return this.engine.setPlayerKey(playerId, key, pressed);
  }

  getState() {
    return this.engine.getState();
  }

  isReady() {
    return this.engine.state === 'playing' && this.players.size > 0;
  }

  cleanup() {
    this.engine.cleanup();
    this.isActive = false;
  }
}

module.exports = GameRoom;