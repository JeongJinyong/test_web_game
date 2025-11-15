import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export enum EnemyType {
  SLIME = 'slime',
  SKELETON = 'skeleton',
  DEMON = 'demon',
  BOSS = 'boss'
}

export class Enemy {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Graphics;
  private body: Phaser.Physics.Arcade.Body;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private type: EnemyType;
  private maxHealth: number;
  private currentHealth: number;
  private damage: number;
  private speed: number;
  private color: number;
  private isDead: boolean = false;
  private fadeOutTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    this.scene = scene;
    this.type = type;

    // 타입별 스탯 설정
    const enemyConfig = GameConfig.enemy.types[type];
    this.maxHealth = enemyConfig.hp;
    this.currentHealth = this.maxHealth;
    this.damage = enemyConfig.damage;
    this.speed = enemyConfig.speed;
    this.color = enemyConfig.color;

    // Graphics로 적 생성
    this.sprite = scene.add.graphics();
    this.drawEnemy();
    this.sprite.setPosition(x, y);

    // 조명 효과 적용
    this.sprite.setPipeline('Light2D');

    // 물리 바디 추가
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    this.body.setCircle(tileSize / 3);
    this.body.setOffset(-tileSize / 3, -tileSize / 3);

    // HP바 생성
    this.createHealthBar();
  }

  private drawEnemy(): void {
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const size = tileSize / 2;

    this.sprite.clear();

    // 타입별 다른 모양
    if (this.type === EnemyType.SLIME) {
      // 슬라임 - 원형
      this.sprite.lineStyle(2, this.color);
      this.sprite.fillStyle(this.color, 0.8);
      this.sprite.fillCircle(0, 0, size / 2);
      this.sprite.strokeCircle(0, 0, size / 2);
    } else if (this.type === EnemyType.SKELETON) {
      // 스켈레톤 - 사각형
      this.sprite.lineStyle(2, this.color);
      this.sprite.fillStyle(this.color, 0.8);
      this.sprite.fillRect(-size / 2, -size / 2, size, size);
      this.sprite.strokeRect(-size / 2, -size / 2, size, size);
    } else if (this.type === EnemyType.DEMON) {
      // 데몬 - 삼각형
      this.sprite.lineStyle(2, this.color);
      this.sprite.fillStyle(this.color, 0.8);
      this.sprite.beginPath();
      this.sprite.moveTo(0, -size / 2);
      this.sprite.lineTo(size / 2, size / 2);
      this.sprite.lineTo(-size / 2, size / 2);
      this.sprite.closePath();
      this.sprite.fillPath();
      this.sprite.strokePath();
    } else if (this.type === EnemyType.BOSS) {
      // 보스 - 큰 육각형
      this.sprite.lineStyle(4, this.color);
      this.sprite.fillStyle(this.color, 0.9);
      const bigSize = size * 1.5;
      this.sprite.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = Math.cos(angle) * bigSize;
        const y = Math.sin(angle) * bigSize;
        if (i === 0) {
          this.sprite.moveTo(x, y);
        } else {
          this.sprite.lineTo(x, y);
        }
      }
      this.sprite.closePath();
      this.sprite.fillPath();
      this.sprite.strokePath();

      // 보스 눈
      this.sprite.fillStyle(0xff0000, 1);
      this.sprite.fillCircle(-8, -4, 3);
      this.sprite.fillCircle(8, -4, 3);
    }
  }

  private createHealthBar(): void {
    const barWidth = 30;
    const barHeight = 4;
    const offsetY = -25;

    // HP바 배경
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(-barWidth / 2, offsetY, barWidth, barHeight);

    // HP바
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const barWidth = 30;
    const barHeight = 4;
    const offsetY = -25;

    this.healthBar.clear();
    const healthPercent = this.currentHealth / this.maxHealth;
    const currentBarWidth = barWidth * healthPercent;

    // HP에 따라 색상 변경
    let barColor = 0x00ff00; // 초록
    if (healthPercent < 0.3) {
      barColor = 0xff0000; // 빨강
    } else if (healthPercent < 0.6) {
      barColor = 0xffff00; // 노랑
    }

    this.healthBar.fillStyle(barColor, 1);
    this.healthBar.fillRect(-barWidth / 2, offsetY, currentBarWidth, barHeight);

    // HP바 위치 업데이트
    this.healthBar.setPosition(this.sprite.x, this.sprite.y);
    this.healthBarBg.setPosition(this.sprite.x, this.sprite.y);
  }

  update(playerX: number, playerY: number): void {
    if (this.isDead) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerX, playerY
    );

    // 플레이어 추적 (범위 내)
    if (distance < GameConfig.enemy.chaseRange) {
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        playerX, playerY
      );

      const velocityX = Math.cos(angle) * this.speed;
      const velocityY = Math.sin(angle) * this.speed;

      this.body.setVelocity(velocityX, velocityY);
    } else {
      this.body.setVelocity(0, 0);
    }

    // HP바 위치 업데이트
    this.updateHealthBar();
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;

    this.currentHealth -= amount;
    this.updateHealthBar();

    // 피격 사운드 이벤트
    this.scene.events.emit('enemyHit');

    // 피격 효과 (깜빡임)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
    });

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  private die(): void {
    if (this.isDead) return;
    this.isDead = true;

    // 속도 0으로
    this.body.setVelocity(0, 0);

    // 피 파티클 효과
    this.createBloodParticles();

    // 페이드아웃 효과
    this.fadeOutTween = this.scene.tweens.add({
      targets: [this.sprite, this.healthBar, this.healthBarBg],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });

    // 골드/아이템 드롭 (나중에 LootSystem과 연동)
    this.dropLoot();
  }

  private createBloodParticles(): void {
    // 피 파티클 폭발
    for (let i = 0; i < 15; i++) {
      const particleGraphics = this.scene.add.graphics();
      particleGraphics.fillStyle(0xaa0000, 1);
      particleGraphics.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      particleGraphics.setPosition(this.sprite.x, this.sprite.y);
      particleGraphics.setPipeline('Light2D');

      const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
      const speed = Phaser.Math.Between(30, 80);
      const endX = this.sprite.x + Math.cos(angle) * speed;
      const endY = this.sprite.y + Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particleGraphics,
        x: endX,
        y: endY,
        alpha: 0,
        duration: Phaser.Math.Between(400, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => {
          particleGraphics.destroy();
        }
      });
    }
  }

  private dropLoot(): void {
    // LootSystem에 드롭 이벤트 발생
    this.scene.events.emit('enemyDied', {
      x: this.sprite.x,
      y: this.sprite.y
    });
  }

  destroy(): void {
    if (this.fadeOutTween) {
      this.fadeOutTween.stop();
    }
    this.sprite.destroy();
    this.healthBar.destroy();
    this.healthBarBg.destroy();
  }

  getSprite(): Phaser.GameObjects.Graphics {
    return this.sprite;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  getDamage(): number {
    return this.damage;
  }

  isDying(): boolean {
    return this.isDead;
  }
}
