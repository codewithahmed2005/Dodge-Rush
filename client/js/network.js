class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomId = null;
    this.playerId = null;
    this.gameState = null;
    
    this.onStateUpdate = null;
    this.onGameOver = null;
    this.onJoined = null;
    this.onError = null;
    this.onConnect = null;
    this.onDisconnect = null;
  }

  connect() {
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔗 Socket.IO connected');
      this.connected = true;
      if (this.onConnect) this.onConnect();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
      this.connected = false;
      if (this.onDisconnect) this.onDisconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      if (this.onError) this.onError('Connection error: ' + error.message);
    });

    this.socket.on('game:joined', (data) => {
      console.log('✅ Joined game:', data);
      this.roomId = data.roomId;
      this.playerId = data.playerId;
      this.gameState = data.state;
      if (this.onJoined) this.onJoined(data);
    });

    this.socket.on('game:state', (state) => {
      this.gameState = state;
      if (this.onStateUpdate) this.onStateUpdate(state);
    });

    this.socket.on('game:over', (data) => {
      console.log('💀 Game over:', data);
      if (this.onGameOver) this.onGameOver(data);
    });

    this.socket.on('game:error', (data) => {
      console.error('⚠️ Game error:', data);
      if (this.onError) this.onError(data.message);
    });
  }

  sendInput(key, pressed) {
    if (!this.connected || !this.socket) return;
    this.socket.emit('player:input', { key, pressed });
  }

  restartGame() {
    if (!this.connected || !this.socket) return;
    this.socket.emit('game:restart');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  getState() {
    return this.gameState;
  }

  isConnected() {
    return this.connected;
  }
}

export default NetworkManager;