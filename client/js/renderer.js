class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
  }

  render(game) {
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.fpsUpdateTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
    
    game.render();
    this.drawFPS();
  }

  drawFPS() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${this.fps}`, 10, 10);
  }

  resize(containerWidth, containerHeight) {
    const aspectRatio = 4 / 3;
    let width = containerWidth;
    let height = containerHeight;
    
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
    
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = 800;
    this.canvas.height = 600;
  }
}

export default Renderer;