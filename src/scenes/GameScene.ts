import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { DungeonGenerator, TileType } from '../systems/DungeonGenerator';
import { Player } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { LootSystem } from '../systems/LootSystem';
import { SoundSystem } from '../systems/SoundSystem';

export class GameScene extends Phaser.Scene {
  private dungeon!: DungeonGenerator;
  private player!: Player;
  private enemies: Enemy[] = [];
  private combatSystem!: CombatSystem;
  private lootSystem!: LootSystem;
  private soundSystem!: SoundSystem;
  private tileGraphics!: Phaser.GameObjects.Graphics;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private playerLight?: Phaser.GameObjects.Light;
  private torchLights: Phaser.GameObjects.Light[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 사운드 시스템 초기화
    this.soundSystem = new SoundSystem();
    this.soundSystem.playBackgroundMusic();

    // 던전 생성
    this.dungeon = new DungeonGenerator(this);
    this.dungeon.generate();

    // 타일맵 렌더링
    this.renderDungeon();

    // 조명 시스템 설정
    this.setupLighting();

    // 플레이어 생성
    const spawnPos = this.dungeon.getSpawnPosition();
    this.player = new Player(this, spawnPos.x, spawnPos.y);

    // 플레이어 조명 추가
    const playerPos = this.player.getPosition();
    this.playerLight = this.lights.addLight(playerPos.x, playerPos.y, 150, 0xaaccff, 1.5);

    // 적 생성 (2-5마리 랜덤)
    const enemyCount = Phaser.Math.Between(
      GameConfig.enemy.spawnCountMin,
      GameConfig.enemy.spawnCountMax
    );
    this.spawnEnemies(enemyCount);

    // 전투 시스템 초기화
    this.combatSystem = new CombatSystem(this, this.player, this.enemies);

    // 루트 시스템 초기화
    this.lootSystem = new LootSystem(this);

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

    // 적 처치 시 드롭 이벤트
    this.events.on('enemyDied', (data: { x: number, y: number }) => {
      this.soundSystem.playEnemyDeathSound();
      this.lootSystem.tryDropLoot(data.x, data.y);
    });

    // 플레이어 공격 이벤트
    this.events.on('playerAttack', () => {
      this.soundSystem.playSwingSound();
    });

    // 플레이어 피격 이벤트
    this.events.on('playerHurt', () => {
      this.soundSystem.playPlayerHurtSound();
    });

    // 아이템 줍기 이벤트
    this.events.on('itemPickedUp', () => {
      this.soundSystem.playPickupSound();
    });

    // 적 피격 이벤트
    this.events.on('enemyHit', () => {
      this.soundSystem.playHitSound();
    });

    // 플레이어 스탯 적용 이벤트
    this.events.on('applyItemStats', (statValue: number, type: 'weapon' | 'armor' | 'ring') => {
      this.player.applyItemStats(statValue, type);
    });

    // 플레이어 스탯 제거 이벤트
    this.events.on('removeItemStats', (statValue: number, type: 'weapon' | 'armor' | 'ring') => {
      this.player.removeItemStats(statValue, type);
    });

    // 플레이어 회복 이벤트
    this.events.on('healPlayer', (amount: number) => {
      this.player.heal(amount);
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
            // 바닥 타일 (더 어두운 회색 - 다크 판타지 느낌)
            this.tileGraphics.fillStyle(0x1a1a1a, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(1, 0x0a0a0a, 0.5);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            break;

          case TileType.WALL:
            // 벽 타일 (더 어두운 갈색)
            this.tileGraphics.fillStyle(0x2a1c10, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(2, 0x1a0c08, 1);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            // 벽 디테일
            this.tileGraphics.fillStyle(0x3a2c18, 0.5);
            this.tileGraphics.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            break;

          case TileType.DOOR:
            // 문 타일 (나무 색상)
            this.tileGraphics.fillStyle(0x6b3513, 1);
            this.tileGraphics.fillRect(px, py, tileSize, tileSize);
            this.tileGraphics.lineStyle(2, 0x4b2311, 1);
            this.tileGraphics.strokeRect(px, py, tileSize, tileSize);
            // 문 손잡이
            this.tileGraphics.fillStyle(0xccaa00, 1);
            this.tileGraphics.fillCircle(px + tileSize * 0.7, py + tileSize / 2, 3);
            break;
        }
      }
    }

    // 타일에 조명 효과 적용
    this.tileGraphics.setPipeline('Light2D');
  }

  private setupLighting(): void {
    // 조명 시스템 활성화
    this.lights.enable();
    this.lights.setAmbientColor(0x0a0a0a); // 매우 어두운 주변 조명 (다크 판타지)

    // 던전 방에 횃불 추가
    this.addTorchesToRooms();
  }

  private addTorchesToRooms(): void {
    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    const tiles = this.dungeon.getTiles();
    const rooms = (this.dungeon as any).rooms; // DungeonGenerator의 rooms 접근

    if (!rooms || rooms.length === 0) return;

    // 각 방의 모서리에 횃불 추가
    rooms.forEach((room: any) => {
      const torches = [
        { x: room.x + 2, y: room.y + 2 },
        { x: room.x + room.width - 3, y: room.y + 2 },
        { x: room.x + 2, y: room.y + room.height - 3 },
        { x: room.x + room.width - 3, y: room.y + room.height - 3 },
      ];

      torches.forEach(torch => {
        // 횃불 위치가 유효한지 확인
        if (torch.x >= 0 && torch.x < tiles[0].length &&
            torch.y >= 0 && torch.y < tiles.length &&
            tiles[torch.y][torch.x] === TileType.FLOOR) {

          const px = torch.x * tileSize + tileSize / 2;
          const py = torch.y * tileSize + tileSize / 2;

          // 횃불 조명 추가 (오렌지색, 깜빡임)
          const light = this.lights.addLight(px, py, 120, 0xff8800, 1.2);
          this.torchLights.push(light);

          // 횃불 그래픽 추가
          const torchGraphics = this.add.graphics();
          torchGraphics.fillStyle(0xff6600, 1);
          torchGraphics.fillCircle(px, py, 4);
          torchGraphics.fillStyle(0xffaa00, 0.8);
          torchGraphics.fillCircle(px, py, 2);
          torchGraphics.setPipeline('Light2D');
        }
      });
    });
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

    // 플레이어 조명 위치 업데이트
    if (this.playerLight) {
      const playerPos = this.player.getPosition();
      this.playerLight.setPosition(playerPos.x, playerPos.y);
    }

    // 횃불 깜빡임 효과
    this.torchLights.forEach((light, index) => {
      const flicker = 1.0 + Math.sin(time * 0.003 + index) * 0.15;
      light.setIntensity(flicker);
    });

    // 전투 시스템 업데이트
    if (this.combatSystem) {
      this.combatSystem.update();
      // 죽은 적 제거
      this.enemies = this.combatSystem.getEnemies();
    }

    // 루트 시스템 업데이트
    if (this.lootSystem) {
      const playerPos = this.player.getPosition();
      this.lootSystem.update(playerPos.x, playerPos.y);
    }
  }
}
