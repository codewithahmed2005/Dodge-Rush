class UIManager {
  constructor(game) {
    this.game = game;
    this.scoreDisplay = document.getElementById('score-display');
    this.gameOverDiv = document.getElementById('game-over');
    this.finalScoreSpan = document.getElementById('final-score');
    this.restartBtn = document.getElementById('restart-btn');
    this.statusDisplay = document.getElementById('game-status');
    
    this.restartBtn.addEventListener('click', () => {
      this.restartGame();
    });
    
    this.startGame();
  }

  startGame() {
    this.game.start();
    this.updateUI();
    this.statusDisplay.textContent = 'Playing 🎮';
    this.statusDisplay.style.color = '#4ade80';
  }

  restartGame() {
    this.game.reset();
    this.gameOverDiv.style.display = 'none';
    this.statusDisplay.textContent = 'Playing 🎮';
    this.statusDisplay.style.color = '#4ade80';
    this.updateUI();
  }

  updateUI() {
    const state = this.game.getState();
    
    this.scoreDisplay.textContent = `Score: ${state.score}`;
    
    if (state.state === 'gameover') {
      this.gameOverDiv.style.display = 'block';
      this.finalScoreSpan.textContent = state.score;
      this.statusDisplay.textContent = 'Game Over 💀';
      this.statusDisplay.style.color = '#ff4444';
    }
  }

  showError(message) {
    const status = document.getElementById('game-status');
    status.textContent = `⚠️ ${message}`;
    status.style.color = '#ff8800';
    setTimeout(() => {
      if (this.game.state === 'playing') {
        status.textContent = 'Playing 🎮';
        status.style.color = '#4ade80';
      }
    }, 3000);
  }
}

export default UIManager;