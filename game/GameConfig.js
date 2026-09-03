const config = require('../config');

class GameConfig {
  static get() {
    return config.game;
  }

  static getPlayerConfig() {
    return config.game.player;
  }

  static getEnemyConfig() {
    return config.game.enemy;
  }

  static getSpawnConfig() {
    return config.game.spawn;
  }

  static getScoreConfig() {
    return config.game.score;
  }

  static getCanvasConfig() {
    return config.game.canvas;
  }

  static getTickRate() {
    return config.game.tickRate;
  }
}

module.exports = GameConfig;