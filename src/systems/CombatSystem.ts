import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { GameConfig } from '../config/GameConfig';

export class CombatSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Enemy[];

  constructor(scene: Phaser.Scene, player: Player, enemies: Enemy[]) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;

    this.setupCollisions();
    this.setupPlayerAttack();
  }

  private setupCollisions(): void {
    // 플레이어와 적 충돌 감지
    this.scene.physics.add.overlap(
      this.player.getBody().gameObject,
      this.enemies.map(e => e.getBody().gameObject),
      (playerObj, enemyObj) => {
        this.handlePlayerEnemyCollision(playerObj, enemyObj);
      }
    );
  }

  private handlePlayerEnemyCollision(playerObj: any, enemyObj: any): void {
    // 적 찾기
    const enemy = this.enemies.find(e => e.getSprite() === enemyObj);
    if (!enemy || enemy.isDying()) return;

    // 충돌 데미지 (일정 주기마다)
    const currentTime = this.scene.time.now;
    const lastCollisionTime = (enemy as any).lastCollisionTime || 0;

    if (currentTime - lastCollisionTime > 1000) { // 1초마다 데미지
      this.player.takeDamage(enemy.getDamage());
      (enemy as any).lastCollisionTime = currentTime;
    }
  }

  private setupPlayerAttack(): void {
    // 플레이어 공격 이벤트 리스너
    this.scene.events.on('playerAttack', (attackData: {
      x: number,
      y: number,
      angle: number,
      damage: number
    }) => {
      this.handlePlayerAttack(attackData);
    });
  }

  private handlePlayerAttack(attackData: {
    x: number,
    y: number,
    angle: number,
    damage: number
  }): void {
    const attackRange = GameConfig.player.attackRange;

    // 공격 범위 내 적 찾기
    this.enemies.forEach(enemy => {
      if (enemy.isDying()) return;

      const enemyPos = enemy.getSprite();
      const distance = Phaser.Math.Distance.Between(
        attackData.x, attackData.y,
        enemyPos.x, enemyPos.y
      );

      if (distance <= attackRange) {
        // 공격 각도 범위 체크 (부채꼴 형태)
        const angleToEnemy = Phaser.Math.Angle.Between(
          attackData.x, attackData.y,
          enemyPos.x, enemyPos.y
        );

        const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - attackData.angle);
        const attackArc = Math.PI / 3; // 60도 범위

        if (Math.abs(angleDiff) <= attackArc) {
          enemy.takeDamage(attackData.damage);
        }
      }
    });
  }

  update(): void {
    // 죽은 적 제거
    this.enemies = this.enemies.filter(enemy => !enemy.isDying());

    // 적 업데이트 (플레이어 추적)
    const playerPos = this.player.getPosition();
    this.enemies.forEach(enemy => {
      enemy.update(playerPos.x, playerPos.y);
    });
  }

  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);

    // 새로운 적에 대한 충돌 감지 추가
    this.scene.physics.add.overlap(
      this.player.getBody().gameObject,
      enemy.getBody().gameObject,
      (playerObj, enemyObj) => {
        this.handlePlayerEnemyCollision(playerObj, enemyObj);
      }
    );
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  clearEnemies(): void {
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
  }
}
