import Phaser from 'phaser';
import { InventoryUI } from '../ui/InventoryUI';
import { ItemData, ItemType } from '../systems/LootSystem';
import { i18n } from '../config/i18n';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Graphics;
  private controlsText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private currentHP: number = 100;
  private maxHP: number = 100;
  private currentFloor: number = 1;

  // 인벤토리
  private inventoryUI!: InventoryUI;

  // 미니맵
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private minimapBg!: Phaser.GameObjects.Graphics;
  private visitedRooms: Set<string> = new Set();

  // 대쉬 쿨타임
  private dashCooldownBg!: Phaser.GameObjects.Graphics;
  private dashCooldownBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { floor?: number }): void {
    this.currentFloor = data.floor || 1;
    this.visitedRooms.clear();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // 타이틀 (고딕 폰트) - 다국어 지원
    const t = i18n.t();
    this.titleText = this.add.text(16, 16, t.title.toUpperCase(), {
      fontFamily: 'Cinzel',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.titleText.setScrollFactor(0);

    // 층수 표시
    this.floorText = this.add.text(16, 120, `${t.floor.toUpperCase()}: ${this.currentFloor}`, {
      fontFamily: 'Cinzel',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.floorText.setScrollFactor(0);

    // HP 텍스트 (고딕 폰트)
    this.healthText = this.add.text(16, 55, `${t.vitality.toUpperCase()}: 100/100`, {
      fontFamily: 'Cinzel',
      fontSize: '16px',
      color: '#aa0000',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.healthText.setScrollFactor(0);

    // HP 바 배경 (가죽 질감 느낌)
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x1a0a00, 0.9);
    this.healthBarBg.fillRect(16, 85, 204, 24);
    this.healthBarBg.lineStyle(3, 0x4a2810, 1);
    this.healthBarBg.strokeRect(16, 85, 204, 24);
    this.healthBarBg.lineStyle(1, 0x000000, 0.8);
    this.healthBarBg.strokeRect(18, 87, 200, 20);
    this.healthBarBg.setScrollFactor(0);

    // HP 바
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.updateHealthBar();

    // 조작 안내 업데이트 (고딕 폰트) - 다국어 지원
    const controlsText = `${t.controls.title}:\n${t.controls.move}\n${t.controls.attack}\n${t.controls.dash}\n${t.controls.pickup}\n${t.controls.inventory}`;
    this.controlsText = this.add.text(width - 16, height - 120, controlsText, {
      fontFamily: 'Cinzel',
      fontSize: '12px',
      color: '#666666',
      align: 'right'
    });
    this.controlsText.setOrigin(1, 1);
    this.controlsText.setScrollFactor(0);

    // FPS 표시 (고딕 폰트)
    const fpsText = this.add.text(width - 16, 16, 'FPS: 60', {
      fontFamily: 'Cinzel',
      fontSize: '12px',
      color: '#666666'
    });
    fpsText.setOrigin(1, 0);
    fpsText.setScrollFactor(0);

    // FPS 업데이트
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
      },
      loop: true
    });

    // 인벤토리 UI 생성
    this.inventoryUI = new InventoryUI(this);

    // 미니맵 생성
    this.createMinimap();

    // 대쉬 쿨타임 UI 생성
    this.createDashCooldownUI();

    // GameScene으로부터 HP 변경 이벤트 리스닝
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('playerHPChanged', (currentHP: number, maxHP: number) => {
        this.updateHP(currentHP, maxHP);
      });

      gameScene.events.on('playerDied', () => {
        this.showGameOver();
      });

      // 아이템 획득 이벤트
      gameScene.events.on('itemPickedUp', (item: ItemData) => {
        this.inventoryUI.addItem(item);
      });

      // 장비 장착 이벤트
      gameScene.events.on('equipItem', (item: ItemData) => {
        this.handleEquipItem(item);
      });

      // 장비 해제 이벤트
      gameScene.events.on('unequipItem', (item: ItemData) => {
        this.handleUnequipItem(item);
      });

      // 포션 사용 이벤트
      gameScene.events.on('usePotion', (healAmount: number) => {
        this.handleUsePotion(healAmount);
      });
    }
  }

  private handleEquipItem(item: ItemData): void {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    // Player에게 스탯 적용 요청
    let statType: 'weapon' | 'armor' | 'ring';
    switch (item.type) {
      case ItemType.WEAPON:
        statType = 'weapon';
        break;
      case ItemType.ARMOR:
        statType = 'armor';
        break;
      case ItemType.RING:
        statType = 'ring';
        break;
      default:
        return;
    }

    gameScene.events.emit('applyItemStats', item.statValue, statType);
  }

  private handleUnequipItem(item: ItemData): void {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    // Player에게 스탯 제거 요청
    let statType: 'weapon' | 'armor' | 'ring';
    switch (item.type) {
      case ItemType.WEAPON:
        statType = 'weapon';
        break;
      case ItemType.ARMOR:
        statType = 'armor';
        break;
      case ItemType.RING:
        statType = 'ring';
        break;
      default:
        return;
    }

    gameScene.events.emit('removeItemStats', item.statValue, statType);
  }

  private handleUsePotion(healAmount: number): void {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    gameScene.events.emit('healPlayer', healAmount);
  }

  private updateHP(currentHP: number, maxHP: number): void {
    this.currentHP = currentHP;
    this.maxHP = maxHP;

    const t = i18n.t();
    this.healthText.setText(`${t.vitality.toUpperCase()}: ${currentHP}/${maxHP}`);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barWidth = 200;
    const barHeight = 20;
    const currentBarWidth = (this.currentHP / this.maxHP) * barWidth;
    const healthPercent = this.currentHP / this.maxHP;

    // 빨간색 그라데이션 (다크 판타지 스타일)
    let darkColor = 0x550000;
    let brightColor = 0xaa0000;

    if (healthPercent < 0.3) {
      // 위험 - 더 어두운 빨강
      darkColor = 0x330000;
      brightColor = 0x660000;
    } else if (healthPercent < 0.6) {
      // 경고 - 주황빛 빨강
      darkColor = 0x551100;
      brightColor = 0x992200;
    }

    // 그라데이션 효과
    this.healthBar.fillStyle(darkColor, 1);
    this.healthBar.fillRect(18, 87, currentBarWidth, barHeight);

    // 밝은 하이라이트
    this.healthBar.fillStyle(brightColor, 0.8);
    this.healthBar.fillRect(18, 87, currentBarWidth, barHeight / 2);

    // 광택 효과
    this.healthBar.fillStyle(0xff6666, 0.3);
    this.healthBar.fillRect(18, 87, currentBarWidth, 4);
  }

  private createMinimap(): void {
    const { width } = this.cameras.main;
    const minimapSize = 200;
    const minimapX = width - minimapSize - 16;
    const minimapY = 16;

    // 미니맵 배경
    this.minimapBg = this.add.graphics();
    this.minimapBg.fillStyle(0x000000, 0.7);
    this.minimapBg.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    this.minimapBg.lineStyle(2, 0x666666, 1);
    this.minimapBg.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
    this.minimapBg.setScrollFactor(0);
    this.minimapBg.setDepth(100);

    // 미니맵 그래픽
    this.minimapGraphics = this.add.graphics();
    this.minimapGraphics.setScrollFactor(0);
    this.minimapGraphics.setDepth(101);
  }

  private createDashCooldownUI(): void {
    const barWidth = 150;
    const barHeight = 20;
    const barX = 16;
    const barY = 150;

    // 대쉬 쿨타임 배경
    this.dashCooldownBg = this.add.graphics();
    this.dashCooldownBg.fillStyle(0x000000, 0.7);
    this.dashCooldownBg.fillRect(barX, barY, barWidth, barHeight);
    this.dashCooldownBg.lineStyle(2, 0x666666, 1);
    this.dashCooldownBg.strokeRect(barX, barY, barWidth, barHeight);
    this.dashCooldownBg.setScrollFactor(0);

    // 대쉬 쿨타임 바
    this.dashCooldownBar = this.add.graphics();
    this.dashCooldownBar.setScrollFactor(0);

    // 대쉬 레이블
    const dashLabel = this.add.text(barX + 5, barY + 3, 'DASH', {
      fontFamily: 'Cinzel',
      fontSize: '12px',
      color: '#00aaff',
      fontStyle: 'bold'
    });
    dashLabel.setScrollFactor(0);
  }

  private updateDashCooldown(): void {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.player) return;

    const barWidth = 150;
    const barHeight = 20;
    const barX = 16;
    const barY = 150;

    const progress = gameScene.player.getDashCooldownProgress();

    this.dashCooldownBar.clear();

    const currentBarWidth = barWidth * progress;

    // 쿨타임 바 색상 (충전 완료 시 밝은 파란색)
    const color = progress >= 1 ? 0x00aaff : 0x004488;
    const alpha = progress >= 1 ? 0.9 : 0.5;

    this.dashCooldownBar.fillStyle(color, alpha);
    this.dashCooldownBar.fillRect(barX, barY, currentBarWidth, barHeight);

    // 광택 효과
    if (progress >= 1) {
      this.dashCooldownBar.fillStyle(0x00ccff, 0.4);
      this.dashCooldownBar.fillRect(barX, barY, currentBarWidth, barHeight / 2);
    }
  }

  private showGameOver(): void {
    const { width, height } = this.cameras.main;
    const t = i18n.t();

    // 최고 층수 가져오기
    const highScore = localStorage.getItem('highScore');
    const highScoreNum = highScore ? parseInt(highScore) : 1;

    // 게임 오버 배경
    const gameOverBg = this.add.graphics();
    gameOverBg.fillStyle(0x000000, 0.9);
    gameOverBg.fillRect(0, 0, width, height);
    gameOverBg.setScrollFactor(0);

    // 게임 오버 텍스트 (고딕 폰트) - 다국어 지원
    const gameOverText = this.add.text(width / 2, height / 2 - 80, t.messages.youDied.toUpperCase(), {
      fontFamily: 'Cinzel',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 8
    });
    gameOverText.setOrigin(0.5, 0.5);
    gameOverText.setScrollFactor(0);

    // 도달한 층수
    const reachedFloorText = this.add.text(width / 2, height / 2, `${t.messages.reachedFloor}: ${this.currentFloor}`, {
      fontFamily: 'Cinzel',
      fontSize: '32px',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    });
    reachedFloorText.setOrigin(0.5, 0.5);
    reachedFloorText.setScrollFactor(0);

    // 최고 층수 기록
    const highScoreText = this.add.text(width / 2, height / 2 + 50, `${t.messages.bestFloor}: ${highScoreNum}`, {
      fontFamily: 'Cinzel',
      fontSize: '24px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3
    });
    highScoreText.setOrigin(0.5, 0.5);
    highScoreText.setScrollFactor(0);

    // 재시작 안내 (고딕 폰트)
    const restartText = this.add.text(width / 2, height / 2 + 120, t.messages.restart, {
      fontFamily: 'Cinzel',
      fontSize: '20px',
      color: '#666666'
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setScrollFactor(0);

    // R 키로 재시작
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene', { floor: 1 });
    });
  }

  private updateMinimap(): void {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.dungeon) return;

    const { width } = this.cameras.main;
    const minimapSize = 200;
    const minimapX = width - minimapSize - 16;
    const minimapY = 16;

    this.minimapGraphics.clear();

    const rooms = gameScene.dungeon.getRooms();
    const playerPos = gameScene.player ? gameScene.player.getTilePosition() : null;
    const tileSize = 32; // GameConfig.tile.size * GameConfig.tile.scale

    if (!rooms || rooms.length === 0) return;

    // 던전 크기 계산
    let minX = 999, minY = 999, maxX = 0, maxY = 0;
    rooms.forEach((room: any) => {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    });

    const dungeonWidth = maxX - minX;
    const dungeonHeight = maxY - minY;
    const scale = Math.min(minimapSize / dungeonWidth, minimapSize / dungeonHeight) * 0.8;

    // 현재 플레이어가 있는 방 찾기
    let currentRoom: any = null;
    if (playerPos) {
      rooms.forEach((room: any) => {
        if (playerPos.x >= room.x && playerPos.x < room.x + room.width &&
            playerPos.y >= room.y && playerPos.y < room.y + room.height) {
          currentRoom = room;
          this.visitedRooms.add(`${room.x},${room.y}`);
        }
      });
    }

    // 방 그리기
    rooms.forEach((room: any) => {
      const roomKey = `${room.x},${room.y}`;
      const isVisited = this.visitedRooms.has(roomKey);
      const isCurrent = currentRoom && room.x === currentRoom.x && room.y === currentRoom.y;

      if (!isVisited && !isCurrent) return; // 방문하지 않은 방은 그리지 않음

      const rx = minimapX + (room.x - minX) * scale + (minimapSize - dungeonWidth * scale) / 2;
      const ry = minimapY + (room.y - minY) * scale + (minimapSize - dungeonHeight * scale) / 2;
      const rw = room.width * scale;
      const rh = room.height * scale;

      // 방 색상
      if (isCurrent) {
        this.minimapGraphics.fillStyle(0xffaa00, 0.8); // 현재 방 - 노란색
      } else {
        this.minimapGraphics.fillStyle(0x666666, 0.5); // 탐험한 방 - 회색
      }

      this.minimapGraphics.fillRect(rx, ry, rw, rh);
      this.minimapGraphics.lineStyle(1, 0x333333, 1);
      this.minimapGraphics.strokeRect(rx, ry, rw, rh);
    });

    // 플레이어 위치 표시
    if (playerPos && currentRoom) {
      const px = minimapX + (playerPos.x - minX) * scale + (minimapSize - dungeonWidth * scale) / 2;
      const py = minimapY + (playerPos.y - minY) * scale + (minimapSize - dungeonHeight * scale) / 2;

      this.minimapGraphics.fillStyle(0x00aaff, 1);
      this.minimapGraphics.fillCircle(px, py, 3);
    }
  }

  update(): void {
    // 인벤토리 UI 업데이트
    if (this.inventoryUI) {
      this.inventoryUI.update();
    }

    // 미니맵 업데이트
    this.updateMinimap();

    // 대쉬 쿨타임 업데이트
    this.updateDashCooldown();
  }
}
