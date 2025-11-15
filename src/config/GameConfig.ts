import Phaser from 'phaser';

export const GameConfig = {
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a1a',
  pixelArt: true,
  roundPixels: true,
  antialias: false,

  tile: {
    size: 16,
    scale: 2, // 16x16 타일을 32x32로 확대
  },

  dungeon: {
    width: 10,
    height: 10,
  },

  player: {
    speed: 150,
    maxHP: 100,
    attackDamageMin: 10,
    attackDamageMax: 15,
    attackCooldown: 500, // milliseconds
    attackRange: 50, // pixels
  },

  enemy: {
    types: {
      slime: {
        name: 'Slime',
        color: 0x44ff44,
        hp: 30,
        damage: 5,
        speed: 50,
      },
      skeleton: {
        name: 'Skeleton',
        color: 0x888888,
        hp: 50,
        damage: 10,
        speed: 100,
      },
      demon: {
        name: 'Demon',
        color: 0xff4444,
        hp: 80,
        damage: 15,
        speed: 150,
      }
    },
    chaseRange: 100, // pixels
    attackRange: 20, // pixels
    spawnCountMin: 2,
    spawnCountMax: 5,
  }
};

export const PhaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  backgroundColor: GameConfig.backgroundColor,
  pixelArt: GameConfig.pixelArt,
  roundPixels: GameConfig.roundPixels,
  antialias: GameConfig.antialias,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
