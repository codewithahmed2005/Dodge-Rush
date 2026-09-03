const GameConfig = require('./GameConfig');

class GameEngine {
  constructor(roomId) {
    this.roomId = roomId;
    this.config = GameConfig.get();
    
    this.state = 'waiting';
    this.score = 0;
    this.survivalTime = 0;
    this.frameCount = 0;
    this.difficulty = 1;
    this.players = {};
    this.enemies = [];
    this.spawnCounter = 0;
    this.spawnInterval = this.config.spawn.interval;
    this.startTime = null;
    this.lastUpdate = Date.now();
    this.gameLoopInterval = null;
    
    console.log(`🏗️ GameEngine created for room ${roomId}`);
  }

  addPlayer(playerId, playerData = {}) {
    const canvasConfig = GameConfig.getCanvasConfig();
    this.players[playerId] = {
      id: playerId,
      x: canvasConfig.width / 2 - GameConfig.getPlayerConfig().width / 2,
      y: canvasConfig.height - GameConfig.getPlayerConfig().height - 20,
      width: GameConfig.getPlayerConfig().width,
      height: GameConfig.getPlayerConfig().height,
      speed: GameConfig.getPlayerConfig().speed,
      keys: {
        left: false,
        right: false,
      },
      ...playerData,
    };
    
    console.log(`👤 Player ${playerId} added. Total players: ${Object.keys(this.players).length}`);
  }

  removePlayer(playerId) {
    delete this.players[playerId];
    console.log(`👤 Player ${playerId} removed. Total players: ${Object.keys(this.players).length}`);
    
    if (Object.keys(this.players).length === 0 && this.state === 'playing') {
      this.gameOver();
    }
  }

  setPlayerKey(playerId, key, pressed) {
    if (!this.players[playerId]) return false;
    
    if (key === 'left') {
      this.players[playerId].keys.left = pressed;
    }
    if (key === 'right') {
      this.players[playerId].keys.right = pressed;
    }
    
    return true;
  }

  startGame() {
    if (this.state === 'playing') {
      console.log(`⚠️ Game already playing in room ${this.roomId}`);
      return;
    }
    
    if (Object.keys(this.players).length === 0) {
      console.log(`⚠️ No players to start game in room ${this.roomId}`);
      return;
    }
    
    console.log(`🎮 STARTING GAME in room ${this.roomId}`);
    console.log(`👥 Players: ${Object.keys(this.players).length}`);
    
    this.state = 'playing';
    this.startTime = Date.now();
    this.lastUpdate = Date.now();
    this.survivalTime = 0;
    this.score = 0;
    this.enemies = [];
    this.difficulty = 1;
    this.spawnInterval = this.config.spawn.interval;
    this.frameCount = 0;
    this.spawnCounter = 0;
    
    this.startGameLoop();
  }

  startGameLoop() {
    const tickRate = GameConfig.getTickRate();
    const tickInterval = 1000 / tickRate;
    
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    
    console.log(`🔄 Game loop started. Tick rate: ${tickRate}hz`);
    
    this.gameLoopInterval = setInterval(() => {
      this.update();
    }, tickInterval);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
      console.log(`⏹️ Game loop stopped for room ${this.roomId}`);
    }
  }

  update() {
    if (this.state !== 'playing') return;
    
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    
    this.frameCount++;
    this.survivalTime += deltaTime;
    
    this.updateDifficulty();
    this.movePlayers();
    this.spawnEnemy();
    this.moveEnemies();
    this.checkCollisions();
    
    this.score = Math.floor(this.survivalTime * this.config.score.multiplier * 10);
  }

  updateDifficulty() {
    this.difficulty = 1 + Math.floor(this.survivalTime / 5) * 0.5;
    
    const newInterval = Math.max(
      this.config.spawn.minInterval,
      this.config.spawn.interval - this.difficulty * 2
    );
    this.spawnInterval = Math.floor(newInterval);
  }

  movePlayers() {
    const playerConfig = GameConfig.getPlayerConfig();
    const canvasConfig = GameConfig.getCanvasConfig();
    const speed = playerConfig.speed;
    
    for (const playerId in this.players) {
      const player = this.players[playerId];
      
      if (player.keys.left) {
        player.x = Math.max(0, player.x - speed);
      }
      if (player.keys.right) {
        player.x = Math.min(
          canvasConfig.width - player.width,
          player.x + speed
        );
      }
    }
  }

  spawnEnemy() {
    this.spawnCounter++;
    
    if (this.spawnCounter >= this.spawnInterval) {
      this.spawnCounter = 0;
      
      const enemyConfig = GameConfig.getEnemyConfig();
      const canvasConfig = GameConfig.getCanvasConfig();
      
      const enemy = {
        id: Date.now() + Math.random() * 1000,
        x: Math.random() * (canvasConfig.width - enemyConfig.radius * 2) + enemyConfig.radius,
        y: -enemyConfig.radius,
        radius: enemyConfig.radius,
        speed: Math.min(
          enemyConfig.maxSpeed,
          enemyConfig.speed + this.difficulty * 0.3
        ),
      };
      
      this.enemies.push(enemy);
      
      // Log every 10th enemy
      if (this.enemies.length % 10 === 0) {
        console.log(`🔴 Enemy count: ${this.enemies.length}`);
      }
    }
  }

  moveEnemies() {
    const canvasConfig = GameConfig.getCanvasConfig();
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;
      
      if (enemy.y > canvasConfig.height + enemy.radius) {
        this.enemies.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (const playerId in this.players) {
      const player = this.players[playerId];
      
      for (const enemy of this.enemies) {
        const closestX = Math.max(player.x, Math.min(enemy.x, player.x + player.width));
        const closestY = Math.max(player.y, Math.min(enemy.y, player.y + player.height));
        
        const dx = enemy.x - closestX;
        const dy = enemy.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.radius) {
          this.playerDied(playerId);
          return;
        }
      }
    }
  }

  playerDied(playerId) {
    console.log(`💀 Player ${playerId} died in room ${this.roomId}`);
    this.removePlayer(playerId);
    
    if (Object.keys(this.players).length === 0) {
      this.gameOver();
    }
  }

  gameOver() {
    if (this.state === 'gameover') return;
    
    this.state = 'gameover';
    this.stopGameLoop();
    this.score = Math.floor(this.survivalTime * this.config.score.multiplier * 10);
    
    console.log(`🏁 Game over in room ${this.roomId}. Score: ${this.score}`);
  }

  getState() {
    return {
      state: this.state,
      score: this.score,
      survivalTime: this.survivalTime,
      difficulty: this.difficulty,
      enemies: this.enemies.map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        radius: e.radius,
      })),
      players: Object.fromEntries(
        Object.entries(this.players).map(([id, player]) => [
          id,
          {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height,
          }
        ])
      ),
    };
  }

  cleanup() {
    this.stopGameLoop();
    this.players = {};
    this.enemies = [];
    console.log(`🧹 Cleaned up room ${this.roomId}`);
  }
}

module.exports = GameEngine;