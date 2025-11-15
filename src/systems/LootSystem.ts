import Phaser from 'phaser';

// 아이템 등급
export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// 아이템 타입
export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  RING = 'ring',
  POTION = 'potion'
}

// 아이템 데이터 구조
export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  statValue: number; // 무기: 공격력, 방어구: HP, 반지: 크리티컬%, 포션: 회복량
}

// 드롭된 아이템 (월드에 표시)
export interface DroppedItem {
  data: ItemData;
  sprite: Phaser.GameObjects.Graphics;
  glowSprite: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
}

export class LootSystem {
  private scene: Phaser.Scene;
  private droppedItems: DroppedItem[] = [];
  private eKey?: Phaser.Input.Keyboard.Key;
  private pickupText?: Phaser.GameObjects.Text;

  // 아이템 등급별 색상
  private static RARITY_COLORS = {
    [ItemRarity.COMMON]: 0x888888,
    [ItemRarity.RARE]: 0x4444ff,
    [ItemRarity.EPIC]: 0x9933ff,
    [ItemRarity.LEGENDARY]: 0xffaa00
  };

  // 드롭 확률
  private static DROP_CHANCE = 0.2; // 20%
  private static RARITY_WEIGHTS = {
    [ItemRarity.COMMON]: 0.5,    // 50%
    [ItemRarity.RARE]: 0.3,      // 30%
    [ItemRarity.EPIC]: 0.15,     // 15%
    [ItemRarity.LEGENDARY]: 0.05 // 5%
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // E키 설정
    if (scene.input.keyboard) {
      this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }
  }

  // 적 처치 시 아이템 드롭 시도
  tryDropLoot(x: number, y: number): void {
    // 20% 확률로 드롭
    if (Math.random() > LootSystem.DROP_CHANCE) {
      return;
    }

    // 아이템 생성
    const item = this.generateRandomItem();
    this.dropItem(item, x, y);
  }

  // 랜덤 아이템 생성
  private generateRandomItem(): ItemData {
    const rarity = this.rollRarity();
    const type = this.rollItemType();

    return {
      id: this.generateItemId(),
      name: this.generateItemName(type, rarity),
      type: type,
      rarity: rarity,
      statValue: this.calculateStatValue(type, rarity)
    };
  }

  // 등급 결정
  private rollRarity(): ItemRarity {
    const roll = Math.random();
    let cumulative = 0;

    for (const [rarity, weight] of Object.entries(LootSystem.RARITY_WEIGHTS)) {
      cumulative += weight;
      if (roll < cumulative) {
        return rarity as ItemRarity;
      }
    }

    return ItemRarity.COMMON;
  }

  // 아이템 타입 결정
  private rollItemType(): ItemType {
    const types = [ItemType.WEAPON, ItemType.ARMOR, ItemType.RING, ItemType.POTION];
    return Phaser.Math.RND.pick(types);
  }

  // 아이템 이름 생성
  private generateItemName(type: ItemType, rarity: ItemRarity): string {
    const prefixes = {
      [ItemRarity.COMMON]: '',
      [ItemRarity.RARE]: 'Fine ',
      [ItemRarity.EPIC]: 'Epic ',
      [ItemRarity.LEGENDARY]: 'Legendary '
    };

    const baseNames = {
      [ItemType.WEAPON]: ['Sword', 'Axe', 'Dagger', 'Mace'],
      [ItemType.ARMOR]: ['Plate', 'Mail', 'Leather', 'Robe'],
      [ItemType.RING]: ['Ring of Power', 'Ring of Fury', 'Ring of Precision'],
      [ItemType.POTION]: ['Health Potion', 'Greater Potion', 'Superior Potion']
    };

    const baseName = Phaser.Math.RND.pick(baseNames[type]);
    return prefixes[rarity] + baseName;
  }

  // 스탯 값 계산
  private calculateStatValue(type: ItemType, rarity: ItemRarity): number {
    const baseValues = {
      [ItemType.WEAPON]: { min: 5, max: 10 },    // 공격력
      [ItemType.ARMOR]: { min: 10, max: 20 },    // HP
      [ItemType.RING]: { min: 5, max: 15 },      // 크리티컬%
      [ItemType.POTION]: { min: 30, max: 50 }    // 회복량
    };

    const rarityMultipliers = {
      [ItemRarity.COMMON]: 1,
      [ItemRarity.RARE]: 1.5,
      [ItemRarity.EPIC]: 2,
      [ItemRarity.LEGENDARY]: 3
    };

    const base = baseValues[type];
    const value = Phaser.Math.Between(base.min, base.max);
    return Math.floor(value * rarityMultipliers[rarity]);
  }

  // 고유 ID 생성
  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 아이템을 바닥에 드롭
  private dropItem(item: ItemData, x: number, y: number): void {
    const color = LootSystem.RARITY_COLORS[item.rarity];

    // 반짝이는 외곽선 (glow)
    const glowSprite = this.scene.add.graphics();
    glowSprite.setPosition(x, y);
    glowSprite.setAlpha(0.6);

    // 아이템 스프라이트
    const sprite = this.scene.add.graphics();
    sprite.setPosition(x, y);

    // 아이템 모양 그리기
    this.drawItemShape(sprite, item.type, color);

    // 반짝이는 애니메이션
    this.scene.tweens.add({
      targets: glowSprite,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // 떨어지는 애니메이션
    sprite.setScale(0);
    this.scene.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 300,
      ease: 'Bounce.easeOut'
    });

    const droppedItem: DroppedItem = {
      data: item,
      sprite: sprite,
      glowSprite: glowSprite,
      x: x,
      y: y
    };

    this.droppedItems.push(droppedItem);

    // Glow 효과 그리기
    this.updateGlowEffect(glowSprite, item.type, color);
  }

  // 아이템 모양 그리기
  private drawItemShape(graphics: Phaser.GameObjects.Graphics, type: ItemType, color: number): void {
    graphics.clear();
    graphics.lineStyle(2, color, 1);
    graphics.fillStyle(color, 0.8);

    switch (type) {
      case ItemType.WEAPON:
        // 검 모양
        graphics.fillRect(-3, -8, 6, 16);
        graphics.fillRect(-5, -10, 10, 4);
        break;

      case ItemType.ARMOR:
        // 갑옷 모양
        graphics.fillRect(-8, -6, 16, 12);
        graphics.fillCircle(0, -4, 3);
        break;

      case ItemType.RING:
        // 반지 모양
        graphics.strokeCircle(0, 0, 6);
        graphics.fillCircle(0, 0, 3);
        break;

      case ItemType.POTION:
        // 포션 병 모양
        graphics.fillRect(-4, -2, 8, 8);
        graphics.fillRect(-2, -6, 4, 4);
        break;
    }
  }

  // Glow 효과 그리기
  private updateGlowEffect(graphics: Phaser.GameObjects.Graphics, type: ItemType, color: number): void {
    graphics.clear();
    graphics.lineStyle(4, color, 0.6);
    graphics.strokeCircle(0, 0, 15);
    graphics.strokeCircle(0, 0, 20);
  }

  // 업데이트 - 플레이어 위치에 따라 줍기 가능 여부 확인
  update(playerX: number, playerY: number): void {
    const pickupRange = 40;
    let nearestItem: DroppedItem | null = null;
    let nearestDistance = pickupRange;

    // 가장 가까운 아이템 찾기
    for (const item of this.droppedItems) {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, item.x, item.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestItem = item;
      }
    }

    // 줍기 안내 텍스트 표시/숨김
    if (nearestItem) {
      this.showPickupPrompt(nearestItem);

      // E키로 줍기
      if (this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.pickupItem(nearestItem);
      }
    } else {
      this.hidePickupPrompt();
    }
  }

  // 줍기 안내 표시
  private showPickupPrompt(item: DroppedItem): void {
    if (!this.pickupText) {
      this.pickupText = this.scene.add.text(0, 0, '', {
        font: '14px monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      this.pickupText.setOrigin(0.5, 1);
    }

    const color = this.getRarityColorHex(item.data.rarity);
    this.pickupText.setText(`[E] ${item.data.name}`);
    this.pickupText.setColor(color);
    this.pickupText.setPosition(item.x, item.y - 25);
    this.pickupText.setVisible(true);
  }

  // 줍기 안내 숨김
  private hidePickupPrompt(): void {
    if (this.pickupText) {
      this.pickupText.setVisible(false);
    }
  }

  // 아이템 줍기
  private pickupItem(droppedItem: DroppedItem): void {
    // 아이템 획득 이벤트 발생
    this.scene.events.emit('itemPickedUp', droppedItem.data);

    // 시각적 효과
    this.scene.tweens.add({
      targets: [droppedItem.sprite, droppedItem.glowSprite],
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => {
        droppedItem.sprite.destroy();
        droppedItem.glowSprite.destroy();
      }
    });

    // 목록에서 제거
    const index = this.droppedItems.indexOf(droppedItem);
    if (index > -1) {
      this.droppedItems.splice(index, 1);
    }

    this.hidePickupPrompt();
  }

  // 등급 색상 헥스 문자열 반환
  private getRarityColorHex(rarity: ItemRarity): string {
    const colors = {
      [ItemRarity.COMMON]: '#888888',
      [ItemRarity.RARE]: '#4444ff',
      [ItemRarity.EPIC]: '#9933ff',
      [ItemRarity.LEGENDARY]: '#ffaa00'
    };
    return colors[rarity];
  }

  // 모든 드롭 아이템 정리
  destroy(): void {
    this.droppedItems.forEach(item => {
      item.sprite.destroy();
      item.glowSprite.destroy();
    });
    this.droppedItems = [];

    if (this.pickupText) {
      this.pickupText.destroy();
    }
  }

  getDroppedItems(): DroppedItem[] {
    return this.droppedItems;
  }
}
