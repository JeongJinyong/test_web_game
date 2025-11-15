import Phaser from 'phaser';
import { ItemData, ItemType, ItemRarity } from '../systems/LootSystem';
import { i18n } from '../config/i18n';

// 장착 슬롯
export interface EquipmentSlot {
  weapon: ItemData | null;
  armor: ItemData | null;
  ring: ItemData | null;
}

export class InventoryUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  private iKey?: Phaser.Input.Keyboard.Key;

  // 인벤토리
  private inventorySlots: (ItemData | null)[] = new Array(8).fill(null);
  private slotGraphics: Phaser.GameObjects.Graphics[] = [];
  private slotTexts: Phaser.GameObjects.Text[] = [];

  // 장착 슬롯
  private equipment: EquipmentSlot = {
    weapon: null,
    armor: null,
    ring: null
  };
  private equipmentGraphics: { [key: string]: Phaser.GameObjects.Graphics } = {};
  private equipmentTexts: { [key: string]: Phaser.GameObjects.Text } = {};

  // 툴팁
  private tooltip?: Phaser.GameObjects.Container;
  private hoveredSlotIndex: number = -1;

  // UI 설정
  private slotSize = 60;
  private slotPadding = 8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
    this.setupInput();
  }

  private createUI(): void {
    const { width, height } = this.scene.cameras.main;

    // 컨테이너 생성
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setDepth(1000);

    // 배경 (어두운 가죽 질감 느낌)
    const bgWidth = 600;
    const bgHeight = 500;
    const bgX = (width - bgWidth) / 2;
    const bgY = (height - bgHeight) / 2;

    const bg = this.scene.add.graphics();

    // 가죽 질감 베이스
    bg.fillStyle(0x1a0f08, 0.95);
    bg.fillRect(bgX, bgY, bgWidth, bgHeight);

    // 가죽 테두리
    bg.lineStyle(5, 0x4a2810, 1);
    bg.strokeRect(bgX, bgY, bgWidth, bgHeight);

    // 안쪽 테두리
    bg.lineStyle(2, 0x2a1808, 1);
    bg.strokeRect(bgX + 8, bgY + 8, bgWidth - 16, bgHeight - 16);

    // 가죽 스티치 느낌
    for (let i = 0; i < bgWidth; i += 20) {
      bg.fillStyle(0x3a2010, 0.5);
      bg.fillCircle(bgX + i, bgY + 4, 2);
      bg.fillCircle(bgX + i, bgY + bgHeight - 4, 2);
    }
    for (let i = 0; i < bgHeight; i += 20) {
      bg.fillStyle(0x3a2010, 0.5);
      bg.fillCircle(bgX + 4, bgY + i, 2);
      bg.fillCircle(bgX + bgWidth - 4, bgY + i, 2);
    }

    this.container.add(bg);

    // 타이틀 (고딕 폰트) - 다국어 지원
    const t = i18n.t();
    const title = this.scene.add.text(width / 2, bgY + 20, `${t.inventory.toUpperCase()} [I]`, {
      fontFamily: 'Cinzel',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#8b6914',
      stroke: '#000000',
      strokeThickness: 3
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // 장착 슬롯 영역
    this.createEquipmentSlots(bgX + 30, bgY + 70);

    // 인벤토리 슬롯 영역
    this.createInventorySlots(bgX + 30, bgY + 270);

    // 안내 텍스트 (고딕 폰트) - 다국어 지원
    const helpText = this.scene.add.text(width / 2, bgY + bgHeight - 30,
      `${t.actions.leftClick}: ${t.actions.use}/${t.actions.equip} | ${t.actions.rightClick}: ${t.actions.unequip}`, {
      fontFamily: 'Cinzel',
      fontSize: '12px',
      color: '#665533'
    });
    helpText.setOrigin(0.5, 0);
    this.container.add(helpText);
  }

  // 장착 슬롯 생성
  private createEquipmentSlots(startX: number, startY: number): void {
    const t = i18n.t();
    const labelY = startY - 30;
    const label = this.scene.add.text(startX, labelY, t.equipment, {
      fontFamily: 'Cinzel',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#aa8844'
    });
    this.container.add(label);

    const slots: { key: keyof EquipmentSlot, label: string, x: number }[] = [
      { key: 'weapon', label: t.equipmentSlots.weapon, x: startX },
      { key: 'armor', label: t.equipmentSlots.armor, x: startX + 180 },
      { key: 'ring', label: t.equipmentSlots.ring, x: startX + 360 }
    ];

    slots.forEach(slot => {
      // 슬롯 배경 (가죽 질감)
      const slotBg = this.scene.add.graphics();
      slotBg.lineStyle(3, 0x4a2810, 1);
      slotBg.fillStyle(0x1a0f08, 0.8);
      slotBg.fillRect(slot.x, startY, 140, 120);
      slotBg.strokeRect(slot.x, startY, 140, 120);
      this.container.add(slotBg);

      // 슬롯 라벨 (고딕 폰트)
      const slotLabel = this.scene.add.text(slot.x + 70, startY + 10, slot.label, {
        fontFamily: 'Cinzel',
        fontSize: '14px',
        color: '#aa8844'
      });
      slotLabel.setOrigin(0.5, 0);
      this.container.add(slotLabel);

      // 아이템 그래픽
      const itemGraphic = this.scene.add.graphics();
      this.equipmentGraphics[slot.key] = itemGraphic;
      this.container.add(itemGraphic);

      // 아이템 텍스트 (고딕 폰트)
      const itemText = this.scene.add.text(slot.x + 70, startY + 90, '', {
        fontFamily: 'Cinzel',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 130 }
      });
      itemText.setOrigin(0.5, 0);
      this.equipmentTexts[slot.key] = itemText;
      this.container.add(itemText);

      // 우클릭으로 장착 해제
      slotBg.setInteractive(
        new Phaser.Geom.Rectangle(slot.x, startY, 140, 120),
        Phaser.Geom.Rectangle.Contains
      );
      slotBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          this.unequipItem(slot.key);
        }
      });
    });
  }

  // 인벤토리 슬롯 생성
  private createInventorySlots(startX: number, startY: number): void {
    const t = i18n.t();
    const labelY = startY - 30;
    const label = this.scene.add.text(startX, labelY, `${t.items} (8 ${t.slots})`, {
      fontFamily: 'Cinzel',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#aa8844'
    });
    this.container.add(label);

    const slotsPerRow = 4;

    for (let i = 0; i < 8; i++) {
      const col = i % slotsPerRow;
      const row = Math.floor(i / slotsPerRow);
      const x = startX + col * (this.slotSize + this.slotPadding);
      const y = startY + row * (this.slotSize + this.slotPadding);

      // 슬롯 배경 (가죽 질감)
      const slotBg = this.scene.add.graphics();
      slotBg.lineStyle(2, 0x4a2810, 1);
      slotBg.fillStyle(0x1a0f08, 0.8);
      slotBg.fillRect(x, y, this.slotSize, this.slotSize);
      slotBg.strokeRect(x, y, this.slotSize, this.slotSize);
      this.container.add(slotBg);

      // 슬롯 번호 (고딕 폰트)
      const slotNum = this.scene.add.text(x + 4, y + 4, `${i + 1}`, {
        fontFamily: 'Cinzel',
        fontSize: '10px',
        color: '#665533'
      });
      this.container.add(slotNum);

      // 아이템 그래픽
      const itemGraphic = this.scene.add.graphics();
      this.slotGraphics.push(itemGraphic);
      this.container.add(itemGraphic);

      // 아이템 텍스트
      const itemText = this.scene.add.text(x + this.slotSize / 2, y + this.slotSize - 8, '', {
        font: '10px monospace',
        color: '#ffffff'
      });
      itemText.setOrigin(0.5, 0);
      this.slotTexts.push(itemText);
      this.container.add(itemText);

      // 상호작용
      slotBg.setInteractive(
        new Phaser.Geom.Rectangle(x, y, this.slotSize, this.slotSize),
        Phaser.Geom.Rectangle.Contains
      );

      slotBg.on('pointerover', () => {
        this.hoveredSlotIndex = i;
        this.showTooltip(i);
      });

      slotBg.on('pointerout', () => {
        this.hoveredSlotIndex = -1;
        this.hideTooltip();
      });

      slotBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.useItem(i);
        }
      });
    }
  }

  // 입력 설정
  private setupInput(): void {
    if (this.scene.input.keyboard) {
      this.iKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    }
  }

  // 업데이트
  update(): void {
    // I키로 토글
    if (this.iKey && Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.toggle();
    }
  }

  // 토글
  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);

    if (!this.isVisible) {
      this.hideTooltip();
    }
  }

  // 아이템 추가
  addItem(item: ItemData): boolean {
    // 빈 슬롯 찾기
    const emptySlotIndex = this.inventorySlots.findIndex(slot => slot === null);

    if (emptySlotIndex === -1) {
      const t = i18n.t();
      console.log(t.messages.inventoryFull);
      return false;
    }

    this.inventorySlots[emptySlotIndex] = item;
    this.updateSlot(emptySlotIndex);
    return true;
  }

  // 슬롯 업데이트
  private updateSlot(index: number): void {
    const item = this.inventorySlots[index];
    const graphic = this.slotGraphics[index];
    const text = this.slotTexts[index];

    graphic.clear();
    text.setText('');

    if (item) {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const baseX = ((this.scene.cameras.main.width - 600) / 2) + 30;
      const baseY = ((this.scene.cameras.main.height - 500) / 2) + 270;
      const x = baseX + col * (this.slotSize + this.slotPadding) + this.slotSize / 2;
      const y = baseY + row * (this.slotSize + this.slotPadding) + this.slotSize / 2;

      this.drawItem(graphic, item, x, y, 1.5);

      // 아이템 수량 표시 (포션 등)
      if (item.type === ItemType.POTION) {
        text.setPosition(x, y + this.slotSize / 2 - 8);
      }
    }
  }

  // 아이템 그리기
  private drawItem(
    graphics: Phaser.GameObjects.Graphics,
    item: ItemData,
    x: number,
    y: number,
    scale: number = 1
  ): void {
    const color = this.getRarityColor(item.rarity);
    graphics.lineStyle(2 * scale, color, 1);
    graphics.fillStyle(color, 0.8);

    switch (item.type) {
      case ItemType.WEAPON:
        graphics.fillRect(x - 3 * scale, y - 8 * scale, 6 * scale, 16 * scale);
        graphics.fillRect(x - 5 * scale, y - 10 * scale, 10 * scale, 4 * scale);
        break;

      case ItemType.ARMOR:
        graphics.fillRect(x - 8 * scale, y - 6 * scale, 16 * scale, 12 * scale);
        graphics.fillCircle(x, y - 4 * scale, 3 * scale);
        break;

      case ItemType.RING:
        graphics.strokeCircle(x, y, 6 * scale);
        graphics.fillCircle(x, y, 3 * scale);
        break;

      case ItemType.POTION:
        graphics.fillRect(x - 4 * scale, y - 2 * scale, 8 * scale, 8 * scale);
        graphics.fillRect(x - 2 * scale, y - 6 * scale, 4 * scale, 4 * scale);
        break;
    }
  }

  // 아이템 사용/장착
  private useItem(slotIndex: number): void {
    const item = this.inventorySlots[slotIndex];
    if (!item) return;

    if (item.type === ItemType.POTION) {
      // 포션 사용
      this.scene.events.emit('usePotion', item.statValue);
      this.inventorySlots[slotIndex] = null;
      this.updateSlot(slotIndex);
    } else {
      // 장비 장착
      this.equipItem(item, slotIndex);
    }
  }

  // 장비 장착
  private equipItem(item: ItemData, slotIndex: number): void {
    let slotKey: keyof EquipmentSlot;

    switch (item.type) {
      case ItemType.WEAPON:
        slotKey = 'weapon';
        break;
      case ItemType.ARMOR:
        slotKey = 'armor';
        break;
      case ItemType.RING:
        slotKey = 'ring';
        break;
      default:
        return;
    }

    // 기존 장비 인벤토리로 반환
    if (this.equipment[slotKey]) {
      const returned = this.addItem(this.equipment[slotKey]!);
      if (!returned) {
        const t = i18n.t();
        console.log(t.messages.cannotEquip);
        return;
      }
    }

    // 장비 적용 이벤트
    this.scene.events.emit('equipItem', item);

    // 장착
    this.equipment[slotKey] = item;
    this.inventorySlots[slotIndex] = null;

    this.updateSlot(slotIndex);
    this.updateEquipmentSlot(slotKey);
  }

  // 장비 해제
  private unequipItem(slotKey: keyof EquipmentSlot): void {
    const item = this.equipment[slotKey];
    if (!item) return;

    // 인벤토리에 공간이 있는지 확인
    const added = this.addItem(item);
    if (!added) {
      const t = i18n.t();
      console.log(t.messages.cannotUnequip);
      return;
    }

    // 장비 해제 이벤트
    this.scene.events.emit('unequipItem', item);

    this.equipment[slotKey] = null;
    this.updateEquipmentSlot(slotKey);
  }

  // 장비 슬롯 업데이트
  private updateEquipmentSlot(slotKey: keyof EquipmentSlot): void {
    const item = this.equipment[slotKey];
    const graphic = this.equipmentGraphics[slotKey];
    const text = this.equipmentTexts[slotKey];

    graphic.clear();
    text.setText('');

    if (item) {
      const { width, height } = this.scene.cameras.main;
      const bgX = (width - 600) / 2;
      const bgY = (height - 500) / 2;

      const positions: { [key: string]: number } = {
        weapon: bgX + 30,
        armor: bgX + 210,
        ring: bgX + 390
      };

      const x = positions[slotKey] + 70;
      const y = bgY + 70 + 60;

      this.drawItem(graphic, item, x, y, 2);

      const color = this.getRarityColorHex(item.rarity);
      text.setText(item.name);
      text.setColor(color);
      text.setPosition(x, y + 30);
    }
  }

  // 툴팁 표시
  private showTooltip(slotIndex: number): void {
    const item = this.inventorySlots[slotIndex];
    if (!item) return;

    if (!this.tooltip) {
      this.tooltip = this.scene.add.container(0, 0);
      this.tooltip.setScrollFactor(0);
      this.tooltip.setDepth(2000);
      this.container.add(this.tooltip);
    }

    this.tooltip.removeAll(true);

    // 툴팁 배경
    const padding = 10;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.lineStyle(2, this.getRarityColor(item.rarity), 1);

    const t = i18n.t();
    // 툴팁 텍스트 - 다국어 지원
    const lines = [
      item.name,
      `${this.getRarityName(item.rarity)}`,
      this.getStatDescription(item)
    ];

    const texts = lines.map((line, i) => {
      const color = i === 0 ? this.getRarityColorHex(item.rarity) : '#ffffff';
      return this.scene.add.text(padding, padding + i * 20, line, {
        fontFamily: 'Cinzel',
        fontSize: '12px',
        color: color
      });
    });

    const maxWidth = Math.max(...texts.map(t => t.width));
    const totalHeight = texts.length * 20;

    bg.fillRect(0, 0, maxWidth + padding * 2, totalHeight + padding * 2);
    bg.strokeRect(0, 0, maxWidth + padding * 2, totalHeight + padding * 2);

    this.tooltip.add(bg);
    texts.forEach(t => this.tooltip!.add(t));

    // 위치 설정 (마우스 근처)
    const col = slotIndex % 4;
    const row = Math.floor(slotIndex / 4);
    const baseX = ((this.scene.cameras.main.width - 600) / 2) + 30;
    const baseY = ((this.scene.cameras.main.height - 500) / 2) + 270;
    const x = baseX + col * (this.slotSize + this.slotPadding) + this.slotSize;
    const y = baseY + row * (this.slotSize + this.slotPadding);

    this.tooltip.setPosition(x + 10, y);
  }

  // 툴팁 숨김
  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.setVisible(false);
    }
  }

  // 스탯 설명 - 다국어 지원
  private getStatDescription(item: ItemData): string {
    const t = i18n.t();
    switch (item.type) {
      case ItemType.WEAPON:
        return `+${item.statValue} ${t.stats.attackDamage}`;
      case ItemType.ARMOR:
        return `+${item.statValue} ${t.stats.maxHP}`;
      case ItemType.RING:
        return `+${item.statValue}% ${t.stats.criticalChance}`;
      case ItemType.POTION:
        return `${t.stats.restoreHP} ${item.statValue} HP`;
      default:
        return '';
    }
  }

  // 등급 이름 가져오기 - 다국어 지원
  private getRarityName(rarity: ItemRarity): string {
    const t = i18n.t();
    switch (rarity) {
      case ItemRarity.COMMON:
        return t.rarity.common;
      case ItemRarity.RARE:
        return t.rarity.rare;
      case ItemRarity.EPIC:
        return t.rarity.epic;
      case ItemRarity.LEGENDARY:
        return t.rarity.legendary;
      default:
        return '';
    }
  }

  // 등급 색상
  private getRarityColor(rarity: ItemRarity): number {
    const colors = {
      [ItemRarity.COMMON]: 0x888888,
      [ItemRarity.RARE]: 0x4444ff,
      [ItemRarity.EPIC]: 0x9933ff,
      [ItemRarity.LEGENDARY]: 0xffaa00
    };
    return colors[rarity];
  }

  // 등급 색상 (헥스)
  private getRarityColorHex(rarity: ItemRarity): string {
    const colors = {
      [ItemRarity.COMMON]: '#888888',
      [ItemRarity.RARE]: '#4444ff',
      [ItemRarity.EPIC]: '#9933ff',
      [ItemRarity.LEGENDARY]: '#ffaa00'
    };
    return colors[rarity];
  }

  // 인벤토리 열려있는지 확인
  isOpen(): boolean {
    return this.isVisible;
  }

  // 장착 장비 가져오기
  getEquipment(): EquipmentSlot {
    return this.equipment;
  }

  // 정리
  destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  }
}
