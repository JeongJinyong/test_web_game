import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Enemy {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Graphics;
  private body: Phaser.Physics.Arcade.Body;
  private tileX: number;
  private tileY: number;
  private health: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.health = 100;

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;

    // Graphics로 적 생성 (빨간색 사각형)
    this.sprite = scene.add.graphics();
    this.drawEnemy();
    this.sprite.setPosition(x, y);

    // 물리 바디 추가
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(tileSize / 3);
    this.body.setOffset(-tileSize / 3, -tileSize / 3);
  }

  private drawEnemy(): void {
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const size = tileSize / 2;

    this.sprite.clear();
    this.sprite.lineStyle(2, 0xff0000);
    this.sprite.fillStyle(0xff4444, 1);
    this.sprite.fillRect(-size / 2, -size / 2, size, size);
    this.sprite.strokeRect(-size / 2, -size / 2, size, size);
  }

  update(): void {
    // 나중에 AI 로직 추가
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }

  getSprite(): Phaser.GameObjects.Graphics {
    return this.sprite;
  }
}
