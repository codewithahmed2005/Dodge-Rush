// SIMPLE server game engine - same logic as your browser game
class SimpleGameEngine {
  constructor() {
    // Game state
    this.state = 'waiting';
    this.score = 0;
    this.survivalTime = 0;
    this.difficulty = 1;
    this.enemies = [];
    this.spawnCounter = 0;
    this.spawnInterval = 60;
    this.frameCount = 0;
    
    // Players
    this.players = {};
    
    // Game loop
    this.loopInterval = null;
    this.lastUpdate = Date.now();
  }

  // Add a player
  addPlayer(playerId) {
    this.players[playerId] = {
      x: 380,
      y: 540,
      width: 40,
      height: 40,
      speed: 5,
      keys: { left: false, right: false }
    };
    
    console.log(`👤 Player ${playerId} joined. Total: ${Object.keys(this.players).length}`);
    
    // Auto-start when first player joins
    if (this.state === 'waiting' && Object.keys(this.players).length > 0) {
      this.startGame();
    }
  }

  // Remove a player
  removePlayer(playerId) {
    delete this.players[playerId];
    console.log(`👤 Player ${playerId} left. Total: ${Object.keys(this.players).length}`);
    
    if (Object.keys(this.players).length === 0) {
      this.gameOver();
    }
  }

  // Handle key press
  setKey(playerId, key, pressed) {
    if (!this.players[playerId]) return;
    if (key === 'left') this.players[playerId].keys.left = pressed;
    if (key === 'right') this.players[playerId].keys.right = pressed;
  }

  // Start game
  startGame() {
    if (this.state === 'playing') return;
    
    console.log('🎮 Game Starting!');
    this.state = 'playing';
    this.score = 0;
    this.survivalTime = 0;
    this.enemies = [];
    this.difficulty = 1;
    this.spawnInterval = 60;
    this.spawnCounter = 0;
    this.frameCount = 0;
    this.lastUpdate = Date.now();
    
    // Start game loop
    if (this.loopInterval) clearInterval(this.loopInterval);
    this.loopInterval = setInterval(() => this.update(), 1000 / 60);
  }

  // Game loop update
  update() {
    if (this.state !== 'playing') return;
    
    const now = Date.now();
    const delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    
    this.frameCount++;
    this.survivalTime += delta;
    this.score = Math.floor(this.survivalTime * 10);
    
    // Update difficulty
    this.difficulty = 1 + Math.floor(this.survivalTime / 5) * 0.5;
    this.spawnInterval = Math.max(15, 60 - this.difficulty * 2);
    
    // Move players
    this.movePlayers();
    
    // Spawn enemies
    this.spawnEnemy();
    
    // Move enemies
    this.moveEnemies();
    
    // Check collisions
    this.checkCollisions();
  }

  movePlayers() {
    for (const id in this.players) {
      const p = this.players[id];
      if (p.keys.left) p.x = Math.max(0, p.x - p.speed);
      if (p.keys.right) p.x = Math.min(760, p.x + p.speed);
    }
  }

  spawnEnemy() {
    this.spawnCounter++;
    if (this.spawnCounter >= this.spawnInterval) {
      this.spawnCounter = 0;
      
      this.enemies.push({
        x: Math.random() * 770 + 15,
        y: -15,
        radius: 15,
        speed: 2 + this.difficulty * 0.3
      });
    }
  }

  moveEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed;
      if (e.y > 615) {
        this.enemies.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (const id in this.players) {
      const p = this.players[id];
      
      for (const e of this.enemies) {
        const closestX = Math.max(p.x, Math.min(e.x, p.x + p.width));
        const closestY = Math.max(p.y, Math.min(e.y, p.y + p.height));
        const distance = Math.sqrt((e.x - closestX) ** 2 + (e.y - closestY) ** 2);
        
        if (distance < e.radius) {
          console.log(`💀 Player ${id} died!`);
          this.state = 'gameover';
          clearInterval(this.loopInterval);
          return;
        }
      }
    }
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    if (this.loopInterval) clearInterval(this.loopInterval);
    console.log(`🏁 Game Over! Score: ${this.score}`);
  }

  // Get game state for clients
  getState() {
    return {
      state: this.state,
      score: this.score,
      survivalTime: this.survivalTime,
      difficulty: this.difficulty,
      enemies: this.enemies.map(e => ({
        x: e.x,
        y: e.y,
        radius: e.radius
      })),
      players: this.players
    };
  }
}

module.exports = SimpleGameEngine;