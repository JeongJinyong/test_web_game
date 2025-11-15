import Phaser from 'phaser';
import { PhaserConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

// 게임 설정에 씬 추가
const config: Phaser.Types.Core.GameConfig = {
  ...PhaserConfig,
  scene: [BootScene, GameScene, UIScene]
};

// 게임 인스턴스 생성
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);

  // 개발 모드에서 콘솔에 게임 정보 출력
  console.log('🎮 Roguelike ARPG Started!');
  console.log('Phaser Version:', Phaser.VERSION);
  console.log('Game Config:', config);
});
