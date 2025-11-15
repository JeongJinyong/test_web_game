import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DOOR = 2
}

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;
  private tiles: TileType[][];

  constructor(scene: Phaser.Scene, width: number = GameConfig.dungeon.width, height: number = GameConfig.dungeon.height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tiles = [];
  }

  generate(): TileType[][] {
    // 초기화 - 모든 타일을 벽으로
    this.tiles = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(TileType.WALL)
    );

    // 테두리는 벽, 내부는 바닥으로 설정 (간단한 방 구조)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        this.tiles[y][x] = TileType.FLOOR;
      }
    }

    // 랜덤으로 일부 벽 추가 (장애물)
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(2, this.width - 3);
      const y = Phaser.Math.Between(2, this.height - 3);
      this.tiles[y][x] = TileType.WALL;
    }

    return this.tiles;
  }

  getTiles(): TileType[][] {
    return this.tiles;
  }

  getTileAt(x: number, y: number): TileType {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return TileType.WALL;
    }
    return this.tiles[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    return this.getTileAt(x, y) === TileType.FLOOR;
  }

  getSpawnPosition(): { x: number, y: number } {
    // 플레이어 스폰 위치 - 던전 중앙
    return {
      x: Math.floor(this.width / 2),
      y: Math.floor(this.height / 2)
    };
  }
}
