import Phaser from 'phaser';
import { InventoryUI } from '../ui/InventoryUI';
import { ItemData, ItemType } from '../systems/LootSystem';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Graphics;
  private controlsText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private currentHP: number = 100;
  private maxHP: number = 100;

  // 인벤토리
  private inventoryUI!: InventoryUI;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // 타이틀 (고딕 폰트)
    this.titleText = this.add.text(16, 16, 'DARK DUNGEON', {
      fontFamily: 'Cinzel',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.titleText.setScrollFactor(0);

    // HP 텍스트 (고딕 폰트)
    this.healthText = this.add.text(16, 55, 'VITALITY: 100/100', {
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

    // 조작 안내 업데이트 (고딕 폰트)
    this.controlsText = this.add.text(width - 16, height - 120,
      'Controls:\nWASD or Arrow Keys - Move\nLeft Click - Attack\nE - Pick up Item\nI - Inventory\nESC - Pause', {
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

    this.healthText.setText(`VITALITY: ${currentHP}/${maxHP}`);
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

  private showGameOver(): void {
    const { width, height } = this.cameras.main;

    // 게임 오버 배경
    const gameOverBg = this.add.graphics();
    gameOverBg.fillStyle(0x000000, 0.9);
    gameOverBg.fillRect(0, 0, width, height);
    gameOverBg.setScrollFactor(0);

    // 게임 오버 텍스트 (고딕 폰트)
    const gameOverText = this.add.text(width / 2, height / 2, 'YOU DIED', {
      fontFamily: 'Cinzel',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 8
    });
    gameOverText.setOrigin(0.5, 0.5);
    gameOverText.setScrollFactor(0);

    // 재시작 안내 (고딕 폰트)
    const restartText = this.add.text(width / 2, height / 2 + 80, 'Press R to Restart', {
      fontFamily: 'Cinzel',
      fontSize: '24px',
      color: '#666666'
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setScrollFactor(0);

    // R 키로 재시작
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }

  update(): void {
    // 인벤토리 UI 업데이트
    if (this.inventoryUI) {
      this.inventoryUI.update();
    }
  }
}
