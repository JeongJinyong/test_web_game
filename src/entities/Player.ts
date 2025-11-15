import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Graphics;
  private body: Phaser.Physics.Arcade.Body;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private tileX: number;
  private tileY: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;

    // Graphics로 플레이어 생성 (파란색 원)
    this.sprite = scene.add.graphics();
    this.drawPlayer();
    this.sprite.setPosition(x, y);

    // 물리 바디 추가
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(tileSize / 3);
    this.body.setOffset(-tileSize / 3, -tileSize / 3);

    // 키보드 입력 설정
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    }
  }

  private drawPlayer(): void {
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const radius = tileSize / 3;

    this.sprite.clear();
    // 외곽선
    this.sprite.lineStyle(2, 0x0088ff);
    this.sprite.fillStyle(0x00aaff, 1);
    this.sprite.fillCircle(0, 0, radius);
    this.sprite.strokeCircle(0, 0, radius);

    // 방향 표시 (작은 점)
    this.sprite.fillStyle(0xffffff, 1);
    this.sprite.fillCircle(radius / 2, 0, 3);
  }

  update(): void {
    if (!this.body) return;

    let velocityX = 0;
    let velocityY = 0;

    // WASD 또는 화살표 키 입력 처리
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      velocityX = -GameConfig.player.speed;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      velocityX = GameConfig.player.speed;
    }

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      velocityY = -GameConfig.player.speed;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      velocityY = GameConfig.player.speed;
    }

    this.body.setVelocity(velocityX, velocityY);

    // 타일 위치 업데이트
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    this.tileX = Math.floor(this.sprite.x / tileSize);
    this.tileY = Math.floor(this.sprite.y / tileSize);
  }

  getTilePosition(): { x: number, y: number } {
    return { x: this.tileX, y: this.tileY };
  }

  getSprite(): Phaser.GameObjects.Graphics {
    return this.sprite;
  }

  setTilePosition(tileX: number, tileY: number): void {
    this.tileX = tileX;
    this.tileY = tileY;

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;

    this.sprite.setPosition(x, y);
  }
}
