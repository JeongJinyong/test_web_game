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

    // 타이틀
    this.titleText = this.add.text(16, 16, 'Roguelike ARPG', {
      font: '24px monospace',
      color: '#00aaff'
    });
    this.titleText.setScrollFactor(0);

    // HP 텍스트
    this.healthText = this.add.text(16, 50, 'HP: 100/100', {
      font: '18px monospace',
      color: '#ff4444'
    });
    this.healthText.setScrollFactor(0);

    // HP 바 배경
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(16, 75, 200, 20);
    this.healthBarBg.lineStyle(2, 0xffffff, 0.3);
    this.healthBarBg.strokeRect(16, 75, 200, 20);
    this.healthBarBg.setScrollFactor(0);

    // HP 바
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.updateHealthBar();

    // 조작 안내 업데이트 (인벤토리 추가)
    this.controlsText = this.add.text(width - 16, height - 120,
      'Controls:\nWASD or Arrow Keys - Move\nLeft Click - Attack\nE - Pick up Item\nI - Inventory\nESC - Pause', {
      font: '14px monospace',
      color: '#888888',
      align: 'right'
    });
    this.controlsText.setOrigin(1, 1);
    this.controlsText.setScrollFactor(0);

    // FPS 표시
    const fpsText = this.add.text(width - 16, 16, 'FPS: 60', {
      font: '14px monospace',
      color: '#888888'
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

    this.healthText.setText(`HP: ${currentHP}/${maxHP}`);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barWidth = 200;
    const barHeight = 20;
    const currentBarWidth = (this.currentHP / this.maxHP) * barWidth;

    // HP에 따라 색상 변경
    let barColor = 0x00ff00; // 초록
    const healthPercent = this.currentHP / this.maxHP;
    if (healthPercent < 0.3) {
      barColor = 0xff0000; // 빨강
    } else if (healthPercent < 0.6) {
      barColor = 0xffff00; // 노랑
    }

    this.healthBar.fillStyle(barColor, 1);
    this.healthBar.fillRect(16, 75, currentBarWidth, barHeight);
  }

  private showGameOver(): void {
    const { width, height } = this.cameras.main;

    // 게임 오버 배경
    const gameOverBg = this.add.graphics();
    gameOverBg.fillStyle(0x000000, 0.7);
    gameOverBg.fillRect(0, 0, width, height);
    gameOverBg.setScrollFactor(0);

    // 게임 오버 텍스트
    const gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER', {
      font: '64px monospace',
      color: '#ff0000'
    });
    gameOverText.setOrigin(0.5, 0.5);
    gameOverText.setScrollFactor(0);

    // 재시작 안내
    const restartText = this.add.text(width / 2, height / 2 + 80, 'Press R to Restart', {
      font: '24px monospace',
      color: '#ffffff'
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
