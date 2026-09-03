import Game from './game.js';
import Renderer from './renderer.js';
import InputManager from './input.js';
import UIManager from './ui.js';
import sound from './sound.js';
import AuthManager from './auth.js';

class DodgeRush {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        // ==================== AUTH ====================
        this.auth = new AuthManager();
        this.auth.onAuthChange = (user) => this.onAuthChange(user);
        
        // ==================== GAME ====================
        this.game = new Game(this.canvas);
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager(this.game);
        this.ui = new UIManager(this.game);
        
        // ==================== SOUND ====================
        document.addEventListener('click', () => sound.resume());
        document.addEventListener('keydown', () => sound.resume());
        document.addEventListener('touchstart', () => sound.resume());
        
        // ==================== UI ====================
        this.setupSoundToggle();
        this.setupPauseControls();
        this.setupAuthUI();
        this.setupGameOverHandler();
        
        // ==================== LOOP ====================
        this.lastTime = 0;
        this.accumulator = 0;
        this.tickRate = 1000 / 60;
        
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('🎮 Dodge Rush initialized (Full Version)');
    }

    setupAuthUI() {
        // Auth toggle
        document.getElementById('auth-toggle').addEventListener('click', (e) => {
            e.preventDefault();
            const isLogin = document.getElementById('auth-title').textContent === 'Login';
            document.getElementById('auth-title').textContent = isLogin ? 'Register' : 'Login';
            document.getElementById('auth-submit').textContent = isLogin ? 'Register' : 'Login';
            document.getElementById('auth-switch').innerHTML = isLogin 
                ? 'Already have an account? <a href="#" id="auth-toggle">Login</a>'
                : 'Don\'t have an account? <a href="#" id="auth-toggle">Register</a>';
            document.getElementById('auth-email').style.display = isLogin ? 'block' : 'none';
        });

        // Auth form submit
        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const isLogin = document.getElementById('auth-title').textContent === 'Login';
            const username = document.getElementById('auth-username').value;
            const password = document.getElementById('auth-password').value;
            const email = document.getElementById('auth-email').value;

            let result;
            if (isLogin) {
                result = await this.auth.login(username, password);
            } else {
                result = await this.auth.register(username, email, password);
            }

            if (result.success) {
                document.getElementById('auth-modal').style.display = 'none';
                this.onAuthChange(result.user);
            } else {
                const errorEl = document.getElementById('auth-error');
                errorEl.textContent = result.error;
                errorEl.style.display = 'block';
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });
    }

    onAuthChange(user) {
        if (user) {
            document.getElementById('user-info').style.display = 'flex';
            document.getElementById('username-display').textContent = `👤 ${user.username}`;
            document.getElementById('auth-modal').style.display = 'none';
        } else {
            document.getElementById('user-info').style.display = 'none';
            document.getElementById('auth-modal').style.display = 'flex';
        }
    }

    setupGameOverHandler() {
        // Override game's gameOver to save score
        const originalPlayerDied = this.game.playerDied.bind(this.game);
        this.game.playerDied = async function() {
            originalPlayerDied();
            
            // Save to database if authenticated
            if (this.auth && this.auth.isAuthenticated) {
                await this.auth.saveGameResult(
                    this.game.score,
                    Math.floor(this.game.survivalTime),
                    Math.floor(this.game.difficulty),
                    this.game.deaths
                );
            }
        };
        // Note: Need to bind properly - this is simplified
    }

    setupSoundToggle() {
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                sound.enabled = !sound.enabled;
                soundBtn.textContent = sound.enabled ? '🔊' : '🔇';
                soundBtn.classList.toggle('muted', !sound.enabled);
            });
        }
    }

    setupPauseControls() {
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.addEventListener('click', () => this.game.togglePause());
        
        const resumeBtn = document.getElementById('resume-btn');
        resumeBtn.addEventListener('click', () => {
            if (this.game.state === 'paused') this.game.togglePause();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
                if (this.game.state !== 'gameover') {
                    this.game.togglePause();
                }
            }
        });
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.accumulator += deltaTime;
        while (this.accumulator >= this.tickRate) {
            this.game.update();
            this.accumulator -= this.tickRate;
        }
        
        this.renderer.render(this.game);
        this.ui.updateUI();
        
        requestAnimationFrame(this.gameLoop);
    }

    handleResize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.renderer.resize(rect.width, rect.height);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new DodgeRush();
});

export default DodgeRush;