class InputManager {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.touchLeft = false;
    this.touchRight = false;
    
    this.setupKeyboard();
    this.setupTouch();
    this.setupGamepad();
  }

  setupKeyboard() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Prevent arrow keys from scrolling
      if (['arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle restart with space
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (this.game.state === 'gameover') {
          this.game.reset();
          document.getElementById('game-over').style.display = 'none';
        }
        return;
      }
      
      // Movement keys
      if (key === 'arrowleft' || key === 'a') {
        this.game.setKey('left', true);
      }
      if (key === 'arrowright' || key === 'd') {
        this.game.setKey('right', true);
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'arrowleft' || key === 'a') {
        this.game.setKey('left', false);
      }
      if (key === 'arrowright' || key === 'd') {
        this.game.setKey('right', false);
      }
    });
  }

  setupTouch() {
    const canvas = this.game.canvas;
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // Touch/Mouse events for buttons
    const setupButton = (button, key) => {
      if (!button) return;
      
      // Touch events
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.setKey(key, true);
        this.touchLeft = key === 'left';
        this.touchRight = key === 'right';
      });
      
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.setKey(key, false);
        this.touchLeft = false;
        this.touchRight = false;
      });
      
      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.game.setKey(key, false);
        this.touchLeft = false;
        this.touchRight = false;
      });
      
      // Mouse events (for desktop testing of buttons)
      button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.game.setKey(key, true);
      });
      
      button.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.game.setKey(key, false);
      });
      
      button.addEventListener('mouseleave', (e) => {
        e.preventDefault();
        this.game.setKey(key, false);
      });
    };
    
    setupButton(leftBtn, 'left');
    setupButton(rightBtn, 'right');
  }

  setupGamepad() {
    // Optional gamepad support
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
    });
    
    // Poll gamepad state
    setInterval(() => {
      const gamepads = navigator.getGamepads();
      if (!gamepads) return;
      
      for (const gamepad of gamepads) {
        if (!gamepad) continue;
        
        // Left stick horizontal
        const axisX = gamepad.axes[0] || 0;
        const threshold = 0.3;
        
        if (axisX < -threshold) {
          this.game.setKey('left', true);
          this.game.setKey('right', false);
        } else if (axisX > threshold) {
          this.game.setKey('right', true);
          this.game.setKey('left', false);
        } else {
          this.game.setKey('left', false);
          this.game.setKey('right', false);
        }
      }
    }, 100);
  }
}

export default InputManager;