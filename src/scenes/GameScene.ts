import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { DungeonGenerator, TileType } from '../systems/DungeonGenerator';
import { Player } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';

export class GameScene extends Phaser.Scene {
  private dungeon!: DungeonGenerator;
  private player!: Player;
  private enemies: Enemy[] = [];
  private combatSystem!: CombatSystem;
  private tileGraphics!: Phaser.GameObjects.Graphics;
  private camera!: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 던전 생성
    this.dungeon = new DungeonGenerator(this);
    this.dungeon.generate();

    // 타일맵 렌더링
    this.renderDungeon();

    // 플레이어 생성
    const spawnPos = this.dungeon.getSpawnPosition();
    this.player = new Player(this, spawnPos.x, spawnPos.y);

    // 적 생성 (2-5마리 랜덤)
    const enemyCount = Phaser.Math.Between(
      GameConfig.enemy.spawnCountMin,
      GameConfig.enemy.spawnCountMax
    );
    this.spawnEnemies(enemyCount);

    // 전투 시스템 초기화
    this.combatSystem = new CombatSystem(this, this.player, this.enemies);

    // 카메라 설정
    this.camera = this.cameras.main;
    this.camera.startFollow(this.player.getSprite(), true, 0.1, 0.1);

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    this.camera.setBounds(
      0,
      0,
      GameConfig.dungeon.width * tileSize,
      GameConfig.dungeon.height * tileSize
    );

    // UI 씬 시작
    this.scene.launch('UIScene');

    // 초기 HP 전송
    this.events.emit('playerHPChanged', this.player.getHP(), this.player.getMaxHP());

    // F5 키로 던전 재생성
    this.input.keyboard?.on('keydown-F5', () => {
      this.scene.restart();
    });
  }

  private renderDungeon(): void {
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const tiles = this.dungeon.getTiles();

    this.tileGraphics = this.add.graphics();

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tileType = tiles[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        switch (tileType) {
          case TileType.FLOOR:
            // 바닥 타일 (어두운 회색)
            this.tileGraphics.fillStyle(0x2a2a2a, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(1, 0x1a1a1a, 0.5);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            break;

          case TileType.WALL:
            // 벽 타일 (갈색)
            this.tileGraphics.fillStyle(0x4a3c28, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(2, 0x3a2c18, 1);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            // 벽 디테일
            this.tileGraphics.fillStyle(0x5a4c38, 0.5);
            this.tileGraphics.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            break;

          case TileType.DOOR:
            // 문 타일 (나무 색상)
            this.tileGraphics.fillStyle(0x8b4513, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(2, 0x654321, 1);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            // 문 손잡이
            this.tileGraphics.fillStyle(0xffff00, 1);
            this.tileGraphics.fillCircle(px + tileSize * 0.7, py + tileSize / 2, 3);
            break;
        }
      }
    }
  }

  private spawnEnemies(count: number): void {
    const tiles = this.dungeon.getTiles();
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;

    // 적 타입 배열
    const enemyTypes = [EnemyType.SLIME, EnemyType.SKELETON, EnemyType.DEMON];

    for (let i = 0; i < count; i++) {
      let tileX, tileY;
      let attempts = 0;

      // 빈 공간 찾기
      do {
        tileX = Phaser.Math.Between(1, GameConfig.dungeon.width - 2);
        tileY = Phaser.Math.Between(1, GameConfig.dungeon.height - 2);
        attempts++;
      } while (tiles[tileY][tileX] !== TileType.FLOOR && attempts < 100);

      if (attempts < 100) {
        // 랜덤 타입 선택
        const randomType = Phaser.Math.RND.pick(enemyTypes);

        // 픽셀 좌표로 변환
        const x = tileX * tileSize + tileSize / 2;
        const y = tileY * tileSize + tileSize / 2;

        const enemy = new Enemy(this, x, y, randomType);
        this.enemies.push(enemy);
      }
    }
  }

  update(time: number, delta: number): void {
    // 플레이어 업데이트
    this.player.update();

    // 전투 시스템 업데이트
    if (this.combatSystem) {
      this.combatSystem.update();
      // 죽은 적 제거
      this.enemies = this.combatSystem.getEnemies();
    }
  }
}
