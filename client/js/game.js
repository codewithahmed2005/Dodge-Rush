// ============================================================
// 🧠 ADDICTIVE DODGE RUSH - WITH SOUND
// ============================================================

import sound from './sound.js';

const CONFIG = {
  player: {
    width: 35,
    height: 35,
    speed: 5,
    color: '#4ade80',
    angryColor: '#ff6b35',
  },
  enemy: {
    radius: 14,
    speed: 2,
    maxSpeed: 10,
    color: '#ff0000',
  },
  spawn: {
    interval: 55,
    minInterval: 8,
  },
  score: {
    multiplier: 1,
  },
  canvas: {
    width: 800,
    height: 600,
  },
  addiction: {
    dailyBonus: {
      streakMultiplier: [1, 1.5, 2, 3, 5, 8, 13, 21, 34, 55],
      maxStreak: 10,
    },
    nearMissChance: 0.15,
    randomRewards: {
      small: { chance: 0.3, points: 5, message: '✨ +5 bonus!' },
      medium: { chance: 0.1, points: 15, message: '⭐ +15 bonus!' },
      large: { chance: 0.03, points: 50, message: '🌟 +50 BONUS!' },
      jackpot: { chance: 0.005, points: 200, message: '🎰 JACKPOT! +200!' },
    },
  },
};

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.canvas.width = CONFIG.canvas.width;
    this.canvas.height = CONFIG.canvas.height;
    
    // ==================== GAME STATE ====================
    this.state = 'idle';        // idle, playing, paused, gameover
    this.score = 0;
    this.survivalTime = 0;
    this.frameCount = 0;
    this.difficulty = 1;
    this.deaths = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalGames = 0;
    this.bestScore = parseInt(localStorage.getItem('addictiveBestScore')) || 0;
    this.totalDeaths = parseInt(localStorage.getItem('addictiveTotalDeaths')) || 0;
    this.lastPlayDate = localStorage.getItem('addictiveLastPlayDate') || null;
    this.dailyStreak = parseInt(localStorage.getItem('addictiveDailyStreak')) || 0;
    
    // ==================== PLAYER ====================
    this.player = {
      x: this.canvas.width / 2 - CONFIG.player.width / 2,
      y: this.canvas.height - CONFIG.player.height - 20,
      width: CONFIG.player.width,
      height: CONFIG.player.height,
      speed: CONFIG.player.speed,
      angry: false,
    };
    
    // ==================== ENEMIES ====================
    this.enemies = [];
    this.spawnCounter = 0;
    this.spawnInterval = CONFIG.spawn.interval;
    
    // ==================== INPUT ====================
    this.keys = { left: false, right: false };
    
    // ==================== EFFECTS ====================
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
    
    // ==================== STATS ====================
    this.nearMisses = 0;
    this.randomRewards = 0;
    this.lastRewardTime = 0;
    
    // ==================== BIND ====================
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
  }

  // ==================== START / RESET / PAUSE ====================

  start() {
    this.state = 'playing';
    this.score = 0;
    this.survivalTime = 0;
    this.frameCount = 0;
    this.difficulty = 1;
    this.deaths = 0;
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnInterval = CONFIG.spawn.interval;
    this.spawnCounter = 0;
    this.nearMisses = 0;
    this.randomRewards = 0;
    this.player.x = this.canvas.width / 2 - CONFIG.player.width / 2;
    this.player.y = this.canvas.height - CONFIG.player.height - 20;
    this.player.angry = false;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.totalGames++;
    
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('pause-btn').textContent = '⏸️';
    
    this.checkDailyStreak();
    
    if (this.dailyStreak > 0) {
      this.addFloatingText(
        this.canvas.width / 2, 
        100, 
        `🔥 ${this.dailyStreak}x Daily Streak!`, 
        '#ffd700', 
        40
      );
    }
  }

  reset() {
    sound.playRestart(); // 🔊 Play Again sound
    this.start();
  }

  togglePause() {
    if (this.state === 'gameover') return;
    
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-overlay').style.display = 'flex';
      document.getElementById('pause-btn').textContent = '▶️';
      sound.playPause(); // 🔊 Pause sound
    } else if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-overlay').style.display = 'none';
      document.getElementById('pause-btn').textContent = '⏸️';
      sound.playResume(); // 🔊 Resume sound
    }
  }

  // ==================== DAILY STREAK ====================

  checkDailyStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (this.lastPlayDate === today) return;
    
    if (this.lastPlayDate === yesterday) {
      this.dailyStreak = Math.min(
        this.dailyStreak + 1,
        CONFIG.addiction.dailyBonus.maxStreak
      );
    } else {
      this.dailyStreak = 1;
    }
    
    this.lastPlayDate = today;
    localStorage.setItem('addictiveLastPlayDate', today);
    localStorage.setItem('addictiveDailyStreak', this.dailyStreak);
    
    const bonus = this.getDailyBonus();
    if (bonus > 0) {
      this.score += bonus;
      this.addFloatingText(
        this.canvas.width / 2,
        150,
        `🎁 Daily Bonus: +${bonus}!`,
        '#ffd700',
        36
      );
      this.createExplosion(this.canvas.width / 2, 150, '#ffd700', 20);
    }
  }

  getDailyBonus() {
    const multipliers = CONFIG.addiction.dailyBonus.streakMultiplier;
    const index = Math.min(this.dailyStreak - 1, multipliers.length - 1);
    return Math.floor(10 * multipliers[index]);
  }

  // ==================== INPUT ====================

  setKey(key, pressed) {
    if (this.state === 'paused') return;
    
    if (key === 'left' || key === 'a') {
      this.keys.left = pressed;
    }
    if (key === 'right' || key === 'd') {
      this.keys.right = pressed;
    }
  }

  // ==================== GAME LOOP ====================

  update() {
    if (this.state !== 'playing') return;
    
    this.frameCount++;
    this.survivalTime += 1 / 60;
    
    this.updateDifficulty();
    this.movePlayer();
    this.spawnEnemy();
    this.moveEnemies();
    this.checkCollisions();
    this.checkRandomReward();
    
    this.score = Math.floor(this.survivalTime * CONFIG.score.multiplier * 10);
    
    this.updateParticles();
    this.updateFloatingTexts();
    if (this.screenShake > 0) this.screenShake *= 0.9;
    if (this.flashAlpha > 0) this.flashAlpha *= 0.95;
    
    this.updateUI();
  }

  // ==================== DIFFICULTY ====================

  updateDifficulty() {
    const oldDifficulty = Math.floor(this.difficulty);
    this.difficulty = 1 + Math.floor(this.survivalTime / 5) * 0.5;
    
    // Level up!
    if (Math.floor(this.difficulty) > oldDifficulty) {
      sound.playLevelUp(); // 🔊 Level Up sound
      this.addFloatingText(
        this.canvas.width / 2,
        180,
        `⚡ LEVEL ${Math.floor(this.difficulty)}!`,
        '#ff8800',
        36
      );
      this.flash('#ff8800', 0.2);
    }
    
    const newInterval = Math.max(
      CONFIG.spawn.minInterval,
      CONFIG.spawn.interval - this.difficulty * 2.5
    );
    this.spawnInterval = Math.floor(newInterval);
    
    this.player.angry = this.difficulty > 3;
  }

  // ==================== PLAYER ====================

  movePlayer() {
    const speed = CONFIG.player.speed + (this.difficulty > 4 ? 0.5 : 0);
    if (this.keys.left) {
      this.player.x = Math.max(0, this.player.x - speed);
    }
    if (this.keys.right) {
      this.player.x = Math.min(
        this.canvas.width - this.player.width,
        this.player.x + speed
      );
    }
  }

  // ==================== ENEMIES ====================

  spawnEnemy() {
    this.spawnCounter++;
    if (this.spawnCounter >= this.spawnInterval) {
      this.spawnCounter = 0;
      
      const isSpecial = Math.random() > 0.85;
      const enemy = {
        x: Math.random() * (this.canvas.width - CONFIG.enemy.radius * 2) + CONFIG.enemy.radius,
        y: -CONFIG.enemy.radius,
        radius: CONFIG.enemy.radius,
        speed: Math.min(
          CONFIG.enemy.maxSpeed,
          CONFIG.enemy.speed + this.difficulty * 0.35
        ),
        isSpecial: isSpecial,
        angle: 0,
        wobble: isSpecial ? Math.random() * 0.5 : 0,
      };
      
      this.enemies.push(enemy);
    }
  }

  moveEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;
      
      if (enemy.isSpecial) {
        enemy.angle += 0.05;
        enemy.x += Math.sin(enemy.angle) * 0.5;
      }
      
      if (this.checkNearMiss(enemy)) {
        this.nearMisses++;
        this.addFloatingText(
          enemy.x,
          enemy.y - 20,
          '😰 SO CLOSE!',
          '#ff8800',
          20
        );
        sound.playNearMiss(); // 🔊 Near Miss sound
      }
      
      // Enemy went below screen without hitting player
      if (enemy.y > this.canvas.height + enemy.radius) {
        this.enemies.splice(i, 1);
        sound.playEnemyMissed(); // 🔊 Enemy Missed sound
      }
    }
  }

  checkNearMiss(enemy) {
    const p = this.player;
    const playerCenterX = p.x + p.width / 2;
    const playerCenterY = p.y + p.height / 2;
    const enemyCenterX = enemy.x;
    const enemyCenterY = enemy.y;
    
    const dist = Math.sqrt(
      (playerCenterX - enemyCenterX) ** 2 + 
      (playerCenterY - enemyCenterY) ** 2
    );
    
    return dist < 50 && 
           enemyCenterY > p.y - 10 && 
           enemyCenterY < p.y + 10 &&
           Math.random() < CONFIG.addiction.nearMissChance;
  }

  // ==================== RANDOM REWARDS ====================

  checkRandomReward() {
    if (this.frameCount % 400 === 0 || Math.random() < 0.002) {
      const rewards = CONFIG.addiction.randomRewards;
      let reward = null;
      
      const roll = Math.random();
      if (roll < rewards.jackpot.chance) {
        reward = rewards.jackpot;
      } else if (roll < rewards.large.chance) {
        reward = rewards.large;
      } else if (roll < rewards.medium.chance) {
        reward = rewards.medium;
      } else if (roll < rewards.small.chance) {
        reward = rewards.small;
      }
      
      if (reward) {
        this.score += reward.points;
        this.randomRewards++;
        this.addFloatingText(
          this.canvas.width / 2,
          200 + Math.random() * 100,
          reward.message,
          '#ffd700',
          30
        );
        this.createExplosion(
          this.canvas.width / 2,
          200 + Math.random() * 100,
          '#ffd700',
          15
        );
        this.flash('#ffd700', 0.2);
        sound.playReward(); // 🔊 Reward sound
      }
    }
  }

  // ==================== COLLISIONS ====================

  checkCollisions() {
    const p = this.player;
    
    for (const enemy of this.enemies) {
      const closestX = Math.max(p.x, Math.min(enemy.x, p.x + p.width));
      const closestY = Math.max(p.y, Math.min(enemy.y, p.y + p.height));
      
      const dx = enemy.x - closestX;
      const dy = enemy.y - closestY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < enemy.radius) {
        this.playerDied();
        return;
      }
    }
  }

  // ==================== DEATH ====================

  playerDied() {
    sound.playCollision(); // 🔊 Collision/Death sound
    
    this.state = 'gameover';
    this.deaths++;
    this.totalDeaths++;
    localStorage.setItem('addictiveTotalDeaths', this.totalDeaths);
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('addictiveBestScore', this.bestScore);
      this.addFloatingText(
        this.canvas.width / 2,
        100,
        `🏆 NEW BEST: ${this.bestScore}!`,
        '#ffd700',
        40
      );
    }
    
    this.screenShake = 20;
    this.flash('#ff0000', 0.5);
    this.createExplosion(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      '#ff0000',
      40
    );
    
    const deathMessages = [
      '💀 BOOM!',
      '😈 GOT YOU!',
      '💥 DED!',
      '🔥 BURN!',
      '😱 OOF!',
      '💀 RIP!',
      '😤 SO CLOSE!',
    ];
    this.addFloatingText(
      this.canvas.width / 2,
      this.canvas.height / 2 - 50,
      deathMessages[Math.floor(Math.random() * deathMessages.length)],
      '#ff4444',
      60
    );
    
    this.showGameOver();
    this.updateUI();
  }

  // ==================== GAME OVER SCREEN ====================

  showGameOver() {
    const gameOverDiv = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const bestScoreSpan = document.getElementById('best-score');
    const deathsSpan = document.getElementById('total-deaths');
    const streakSpan = document.getElementById('streak-info');
    
    finalScore.textContent = this.score;
    bestScoreSpan.textContent = this.bestScore;
    deathsSpan.textContent = this.totalDeaths;
    streakSpan.textContent = `🔥 ${this.dailyStreak}x`;
    
    gameOverDiv.style.display = 'block';
    document.getElementById('pause-btn').textContent = '⏸️';
  }

  // ==================== EFFECTS ====================

  createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 6 + 2,
        color: color,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        gravity: 0.15,
      });
    }
  }

  addFloatingText(x, y, text, color, size) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      size: size || 24,
      life: 1,
      vy: -2,
      decay: 0.015,
    });
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= t.decay;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  flash(color, alpha) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  updateUI() {
    const state = this.getState();
    document.getElementById('score-display').textContent = `Score: ${state.score}`;
    document.getElementById('streak-display').textContent = `🔥 ${this.dailyStreak}x`;
    document.getElementById('deaths-display').textContent = `💀 ${this.totalDeaths}`;
    document.getElementById('best-display').textContent = `🏆 ${this.bestScore}`;
  }

  // ==================== RENDER ====================

  render() {
    const ctx = this.ctx;
    
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 1) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground(ctx);
    this.drawEnemies(ctx);
    this.drawPlayer(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);
    this.drawHUD(ctx);
    
    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha * 0.3})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    ctx.restore();
    
    // Draw pause overlay (on canvas for visual effect)
    if (this.state === 'paused') {
      this.drawPauseOverlay(ctx);
    }
  }

  drawBackground(ctx) {
    const colors = [
      '#0a0a1a', '#1a0a1a', '#2a0a1a', '#3a0a0a', '#4a0000'
    ];
    const index = Math.min(Math.floor(this.difficulty) - 1, colors.length - 1);
    const color = colors[Math.max(0, index)] || '#0a0a1a';
    
    const gradient = ctx.createRadialGradient(
      this.canvas.width / 2, 0, 50,
      this.canvas.width / 2, 0, this.canvas.height
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.difficulty > 4) {
      const pulse = Math.sin(this.frameCount * 0.05) * 0.02 + 0.03;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawPlayer(ctx) {
    const p = this.player;
    const color = p.angry ? CONFIG.player.angryColor : CONFIG.player.color;
    
    ctx.fillStyle = `${color}33`;
    ctx.fillRect(p.x - 10, p.y - 10, p.width + 20, p.height + 20);
    
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = p.angry ? 30 : 20;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(p.x + 5, p.y + 8, 6, 6);
    ctx.fillRect(p.x + p.width - 11, p.y + 8, 6, 6);
    
    if (p.angry) {
      ctx.fillRect(p.x + 2, p.y + 4, 10, 3);
      ctx.fillRect(p.x + p.width - 12, p.y + 4, 10, 3);
      ctx.fillRect(p.x + 8, p.y + p.height - 8, p.width - 16, 4);
    } else {
      ctx.fillRect(p.x + 6, p.y + 12, 4, 4);
      ctx.fillRect(p.x + p.width - 10, p.y + 12, 4, 4);
    }
  }

  drawEnemies(ctx) {
    for (const enemy of this.enemies) {
      const gradient = ctx.createRadialGradient(
        enemy.x, enemy.y, 0,
        enemy.x, enemy.y, enemy.radius * 2.5
      );
      const intensity = enemy.isSpecial ? 0.5 : 0.3;
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      const color = enemy.isSpecial ? '#ff00ff' : '#ff0000';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (enemy.isSpecial) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', enemy.x, enemy.y + 5);
      }
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawFloatingTexts(ctx) {
    for (const t of this.floatingTexts) {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  drawHUD(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 50);
    
    ctx.fillStyle = '#ff8800';
    ctx.font = '18px Arial';
    ctx.fillText(`Level ${Math.floor(this.difficulty)}`, 20, 80);
    
    const progress = (this.survivalTime % 5) / 5 * 100;
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 125, 150, 6);
    ctx.fillStyle = `hsl(${120 - progress * 1.2}, 100%, 50%)`;
    ctx.fillRect(20, 125, 150 * (progress / 100), 6);
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Next level in ${Math.ceil(5 - (this.survivalTime % 5))}s`, 20, 142);
  }

  drawPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 64px Arial';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.fillText('⏸️ PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE or click Resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${this.score}  |  Level: ${Math.floor(this.difficulty)}`, this.canvas.width / 2, this.canvas.height / 2 + 100);
  }

  // ==================== GET STATE ====================

  getState() {
    return {
      state: this.state,
      score: this.score,
      survivalTime: this.survivalTime,
      difficulty: this.difficulty,
      deaths: this.deaths,
      totalDeaths: this.totalDeaths,
      bestScore: this.bestScore,
      dailyStreak: this.dailyStreak,
      nearMisses: this.nearMisses,
    };
  }
}

export default Game;