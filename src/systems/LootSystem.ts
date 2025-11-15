import Phaser from 'phaser';

export interface LootItem {
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'weapon' | 'armor' | 'potion' | 'gold';
}

export class LootSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateLoot(): LootItem[] {
    const loot: LootItem[] = [];
    const roll = Math.random();

    if (roll < 0.7) {
      loot.push({
        name: 'Gold',
        rarity: 'common',
        type: 'gold'
      });
    }

    if (roll < 0.3) {
      loot.push({
        name: 'Health Potion',
        rarity: 'common',
        type: 'potion'
      });
    }

    return loot;
  }
}
