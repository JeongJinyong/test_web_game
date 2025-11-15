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

  // Combat properties
  private maxHP: number;
  private currentHP: number;
  private attackDamageMin: number;
  private attackDamageMax: number;
  private attackCooldown: number;
  private lastAttackTime: number = 0;
  private isAttacking: boolean = false;
  private attackGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;

    // Combat stats initialization
    this.maxHP = GameConfig.player.maxHP;
    this.currentHP = this.maxHP;
    this.attackDamageMin = GameConfig.player.attackDamageMin;
    this.attackDamageMax = GameConfig.player.attackDamageMax;
    this.attackCooldown = GameConfig.player.attackCooldown;

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

    // 마우스 클릭 이벤트
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onMouseClick(pointer);
    });
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

  private onMouseClick(pointer: Phaser.Input.Pointer): void {
    const currentTime = this.scene.time.now;

    // 쿨타임 체크
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    // 마우스 위치 (카메라 스크롤 고려)
    const worldX = pointer.x + this.scene.cameras.main.scrollX;
    const worldY = pointer.y + this.scene.cameras.main.scrollY;

    this.performAttack(worldX, worldY);
    this.lastAttackTime = currentTime;
  }

  private performAttack(targetX: number, targetY: number): void {
    this.isAttacking = true;

    // 공격 방향 계산
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      targetX, targetY
    );

    // 검 휘두르기 애니메이션
    this.showAttackAnimation(angle);

    // 공격 이벤트 발생 (GameScene에서 처리)
    this.scene.events.emit('playerAttack', {
      x: this.sprite.x,
      y: this.sprite.y,
      angle: angle,
      damage: this.getAttackDamage()
    });

    // 공격 애니메이션 후 상태 리셋
    this.scene.time.delayedCall(200, () => {
      this.isAttacking = false;
    });
  }

  private showAttackAnimation(angle: number): void {
    // 공격 애니메이션 그래픽
    if (this.attackGraphics) {
      this.attackGraphics.destroy();
    }

    this.attackGraphics = this.scene.add.graphics();
    this.attackGraphics.setPosition(this.sprite.x, this.sprite.y);

    // 검 모양 (선)
    const attackRange = GameConfig.player.attackRange;
    this.attackGraphics.lineStyle(4, 0xffff00, 1);

    const startX = Math.cos(angle) * 10;
    const startY = Math.sin(angle) * 10;
    const endX = Math.cos(angle) * attackRange;
    const endY = Math.sin(angle) * attackRange;

    this.attackGraphics.beginPath();
    this.attackGraphics.moveTo(startX, startY);
    this.attackGraphics.lineTo(endX, endY);
    this.attackGraphics.strokePath();

    // 검 끝 부분 강조
    this.attackGraphics.fillStyle(0xffffff, 1);
    this.attackGraphics.fillCircle(endX, endY, 3);

    // 페이드아웃 애니메이션
    this.scene.tweens.add({
      targets: this.attackGraphics,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.attackGraphics) {
          this.attackGraphics.destroy();
          this.attackGraphics = undefined;
        }
      }
    });
  }

  private getAttackDamage(): number {
    return Phaser.Math.Between(this.attackDamageMin, this.attackDamageMax);
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

  takeDamage(amount: number): void {
    this.currentHP -= amount;
    if (this.currentHP < 0) {
      this.currentHP = 0;
    }

    // 피격 효과
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    // HP 업데이트 이벤트 (UI 업데이트용)
    this.scene.events.emit('playerHPChanged', this.currentHP, this.maxHP);

    if (this.currentHP <= 0) {
      this.die();
    }
  }

  private die(): void {
    console.log('Player died!');
    // TODO: 게임 오버 처리
    this.scene.events.emit('playerDied');
  }

  heal(amount: number): void {
    this.currentHP += amount;
    if (this.currentHP > this.maxHP) {
      this.currentHP = this.maxHP;
    }
    this.scene.events.emit('playerHPChanged', this.currentHP, this.maxHP);
  }

  getTilePosition(): { x: number, y: number } {
    return { x: this.tileX, y: this.tileY };
  }

  getPosition(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getSprite(): Phaser.GameObjects.Graphics {
    return this.sprite;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  getHP(): number {
    return this.currentHP;
  }

  getMaxHP(): number {
    return this.maxHP;
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
