import Phaser from 'phaser';

export class CombatSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  calculateDamage(baseDamage: number, critChance: number = 0.1): number {
    const isCrit = Math.random() < critChance;
    return isCrit ? baseDamage * 2 : baseDamage;
  }

  applyDamage(target: any, damage: number): void {
    if (target && typeof target.takeDamage === 'function') {
      target.takeDamage(damage);
    }
  }
}
