import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

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

    // HP 바 (간단한 텍스트로)
    this.healthText = this.add.text(16, 50, 'HP: 100/100', {
      font: '18px monospace',
      color: '#ff4444'
    });
    this.healthText.setScrollFactor(0);

    // 조작 안내
    this.controlsText = this.add.text(width - 16, height - 80,
      'Controls:\nWASD or Arrow Keys - Move\nESC - Pause', {
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
  }

  update(): void {
    // 나중에 게임 데이터와 연동하여 UI 업데이트
  }
}
