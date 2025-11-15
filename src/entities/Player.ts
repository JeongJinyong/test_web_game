import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { i18n } from '../config/i18n';

export class Player {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Graphics;
  private body: Phaser.Physics.Arcade.Body;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;

  private tileX: number;
  private tileY: number;

  // Dash skill properties
  private isDashing: boolean = false;
  private isInvincible: boolean = false;
  private dashCooldown: number = 5000; // 5초
  private lastDashTime: number = 0;
  private dashDuration: number = 300; // 0.3초
  private dashSpeed: number = 600;

  // Combat properties
  private maxHP: number;
  private baseMaxHP: number; // 기본 HP
  private currentHP: number;
  private attackDamageMin: number;
  private attackDamageMax: number;
  private baseAttackDamageMin: number; // 기본 공격력
  private baseAttackDamageMax: number;
  private criticalChance: number = 0; // 크리티컬 확률 (%)
  private attackCooldown: number;
  private lastAttackTime: number = 0;
  private isAttacking: boolean = false;
  private attackGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;

    // Combat stats initialization
    this.baseMaxHP = GameConfig.player.maxHP;
    this.maxHP = this.baseMaxHP;
    this.currentHP = this.maxHP;
    this.baseAttackDamageMin = GameConfig.player.attackDamageMin;
    this.baseAttackDamageMax = GameConfig.player.attackDamageMax;
    this.attackDamageMin = this.baseAttackDamageMin;
    this.attackDamageMax = this.baseAttackDamageMax;
    this.attackCooldown = GameConfig.player.attackCooldown;

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;

    // Container 생성
    this.container = scene.add.container(x, y);

    // Graphics로 플레이어 생성 (파란색 원)
    this.sprite = scene.add.graphics();
    this.drawPlayer();

    // Graphics를 Container에 추가
    this.container.add(this.sprite);

    // 조명 효과 적용
    this.sprite.setPipeline('Light2D');

    // Container에 물리 바디 추가
    scene.physics.add.existing(this.container);
    this.body = this.container.body as Phaser.Physics.Arcade.Body;
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
      this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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

    // 카메라 쉐이크 (가볍게)
    this.scene.cameras.main.shake(100, 0.002);

    // 공격 이벤트 발생 (GameScene에서 처리)
    this.scene.events.emit('playerAttack', {
      x: this.container.x,
      y: this.container.y,
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
    this.attackGraphics.setPosition(this.container.x, this.container.y);

    // 검 모양 - 빨간 슬래시 (다크 판타지)
    const attackRange = GameConfig.player.attackRange;
    this.attackGraphics.lineStyle(6, 0xff2244, 1);

    const startX = Math.cos(angle) * 10;
    const startY = Math.sin(angle) * 10;
    const endX = Math.cos(angle) * attackRange;
    const endY = Math.sin(angle) * attackRange;

    // 슬래시 효과 - 아크 모양
    this.attackGraphics.beginPath();
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const currentAngle = angle + (Math.PI / 4) * (t - 0.5);
      const dist = attackRange * (0.5 + 0.5 * Math.sin(t * Math.PI));
      const px = Math.cos(currentAngle) * dist;
      const py = Math.sin(currentAngle) * dist;

      if (i === 0) {
        this.attackGraphics.moveTo(px, py);
      } else {
        this.attackGraphics.lineTo(px, py);
      }
    }
    this.attackGraphics.strokePath();

    // 빨간 파티클 효과
    this.createSlashParticles(endX, endY);

    // 조명 효과 적용
    this.attackGraphics.setPipeline('Light2D');

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

  private createSlashParticles(x: number, y: number): void {
    // 빨간 슬래시 파티클
    for (let i = 0; i < 5; i++) {
      const particleGraphics = this.scene.add.graphics();
      particleGraphics.fillStyle(0xff4466, 1);
      particleGraphics.fillCircle(0, 0, 3);
      particleGraphics.setPosition(this.container.x + x, this.container.y + y);
      particleGraphics.setPipeline('Light2D');

      const randomX = Phaser.Math.Between(-20, 20);
      const randomY = Phaser.Math.Between(-20, 20);

      this.scene.tweens.add({
        targets: particleGraphics,
        x: particleGraphics.x + randomX,
        y: particleGraphics.y + randomY,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          particleGraphics.destroy();
        }
      });
    }
  }

  private getAttackDamage(): number {
    let damage = Phaser.Math.Between(this.attackDamageMin, this.attackDamageMax);

    // 크리티컬 계산
    if (Math.random() * 100 < this.criticalChance) {
      damage *= 2;
      // 크리티컬 이펙트 표시
      this.showCriticalEffect();
    }

    return damage;
  }

  private showCriticalEffect(): void {
    const playerPos = this.getPosition();
    const t = i18n.t();
    const critText = this.scene.add.text(playerPos.x, playerPos.y - 50, t.messages.critical.toUpperCase(), {
      font: 'bold 20px monospace',
      color: '#ff0000'
    });
    critText.setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: critText,
      y: playerPos.y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        critText.destroy();
      }
    });
  }

  update(): void {
    if (!this.body) {
      console.error('[Player] Body is null!');
      return;
    }

    // 대쉬 처리
    if (!this.isDashing && this.spaceKey?.isDown) {
      this.tryDash();
    }

    // 대쉬 중이 아닐 때만 일반 이동
    if (!this.isDashing) {
      let velocityX = 0;
      let velocityY = 0;

      // WASD 또는 화살표 키 입력 처리
      const leftPressed = this.cursors?.left.isDown || this.wasd?.A.isDown;
      const rightPressed = this.cursors?.right.isDown || this.wasd?.D.isDown;
      const upPressed = this.cursors?.up.isDown || this.wasd?.W.isDown;
      const downPressed = this.cursors?.down.isDown || this.wasd?.S.isDown;

      if (leftPressed) {
        velocityX = -GameConfig.player.speed;
      } else if (rightPressed) {
        velocityX = GameConfig.player.speed;
      }

      if (upPressed) {
        velocityY = -GameConfig.player.speed;
      } else if (downPressed) {
        velocityY = GameConfig.player.speed;
      }

      // 디버깅: 키 입력 및 속도 로그
      if (velocityX !== 0 || velocityY !== 0) {
        console.log(`[Player] Moving - VelX: ${velocityX}, VelY: ${velocityY}, Pos: (${this.container.x.toFixed(2)}, ${this.container.y.toFixed(2)})`);
      }

      this.body.setVelocity(velocityX, velocityY);
    }

    // 타일 위치 업데이트
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    this.tileX = Math.floor(this.container.x / tileSize);
    this.tileY = Math.floor(this.container.y / tileSize);
  }

  private tryDash(): void {
    const currentTime = this.scene.time.now;

    // 쿨타임 체크
    if (currentTime - this.lastDashTime < this.dashCooldown) {
      return;
    }

    // 현재 이동 방향 계산
    let dirX = 0;
    let dirY = 0;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      dirX = -1;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      dirX = 1;
    }

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      dirY = -1;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      dirY = 1;
    }

    // 방향이 없으면 오른쪽으로 대쉬
    if (dirX === 0 && dirY === 0) {
      dirX = 1;
    }

    // 대쉬 실행
    this.performDash(dirX, dirY);
    this.lastDashTime = currentTime;
  }

  private performDash(dirX: number, dirY: number): void {
    this.isDashing = true;
    this.isInvincible = true;

    // 대쉬 방향으로 빠르게 이동
    this.body.setVelocity(dirX * this.dashSpeed, dirY * this.dashSpeed);

    // 대쉬 이펙트
    this.showDashEffect();

    // 대쉬 종료
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.isInvincible = false;
      this.body.setVelocity(0, 0);
    });

    // 대쉬 사운드 (이벤트 발생)
    this.scene.events.emit('playerDash');
  }

  private showDashEffect(): void {
    // 잔상 효과
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const afterImage = this.scene.add.graphics();
        afterImage.fillStyle(0x00aaff, 0.5 - i * 0.1);
        afterImage.fillCircle(this.container.x, this.container.y, 10);
        afterImage.setPipeline('Light2D');

        this.scene.tweens.add({
          targets: afterImage,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            afterImage.destroy();
          }
        });
      });
    }
  }

  getDashCooldownProgress(): number {
    const currentTime = this.scene.time.now;
    const timeSinceLastDash = currentTime - this.lastDashTime;
    return Math.min(timeSinceLastDash / this.dashCooldown, 1);
  }

  isPlayerInvincible(): boolean {
    return this.isInvincible;
  }

  takeDamage(amount: number): void {
    // 무적 상태면 데미지 무시
    if (this.isInvincible) {
      return;
    }

    this.currentHP -= amount;
    if (this.currentHP < 0) {
      this.currentHP = 0;
    }

    // 피격 사운드 이벤트
    this.scene.events.emit('playerHurt');

    // 카메라 쉐이크 (피격 시 더 강하게)
    this.scene.cameras.main.shake(150, 0.005);

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
    return { x: this.container.x, y: this.container.y };
  }

  getSprite(): Phaser.GameObjects.Container {
    return this.container;
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

    this.container.setPosition(x, y);
  }

  // 아이템 장착 스탯 적용
  applyItemStats(statValue: number, type: 'weapon' | 'armor' | 'ring'): void {
    switch (type) {
      case 'weapon':
        this.attackDamageMin = this.baseAttackDamageMin + statValue;
        this.attackDamageMax = this.baseAttackDamageMax + statValue;
        break;

      case 'armor':
        const hpDiff = statValue;
        this.maxHP = this.baseMaxHP + hpDiff;
        this.currentHP += hpDiff;
        if (this.currentHP > this.maxHP) {
          this.currentHP = this.maxHP;
        }
        this.scene.events.emit('playerHPChanged', this.currentHP, this.maxHP);
        break;

      case 'ring':
        this.criticalChance += statValue;
        break;
    }
  }

  // 아이템 장착 해제 스탯 제거
  removeItemStats(statValue: number, type: 'weapon' | 'armor' | 'ring'): void {
    switch (type) {
      case 'weapon':
        this.attackDamageMin = this.baseAttackDamageMin;
        this.attackDamageMax = this.baseAttackDamageMax;
        break;

      case 'armor':
        const hpDiff = statValue;
        this.maxHP = this.baseMaxHP;
        if (this.currentHP > this.maxHP) {
          this.currentHP = this.maxHP;
        }
        this.scene.events.emit('playerHPChanged', this.currentHP, this.maxHP);
        break;

      case 'ring':
        this.criticalChance -= statValue;
        if (this.criticalChance < 0) {
          this.criticalChance = 0;
        }
        break;
    }
  }

  getCriticalChance(): number {
    return this.criticalChance;
  }
}
