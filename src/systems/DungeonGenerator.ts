import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DOOR = 2
}

/**
 * 방 클래스
 */
export class Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.centerX = Math.floor(x + width / 2);
    this.centerY = Math.floor(y + height / 2);
  }

  /**
   * 두 방 사이의 거리 계산
   */
  distanceTo(other: Room): number {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 방이 겹치는지 확인
   */
  intersects(other: Room, padding: number = 1): boolean {
    return !(
      this.x + this.width + padding <= other.x ||
      other.x + other.width + padding <= this.x ||
      this.y + this.height + padding <= other.y ||
      other.y + other.height + padding <= this.y
    );
  }
}

/**
 * 복도 클래스
 */
export class Corridor {
  points: { x: number; y: number }[];

  constructor(from: Room, to: Room) {
    this.points = this.createLShapedCorridor(from, to);
  }

  /**
   * L자 형태의 복도 생성
   */
  private createLShapedCorridor(from: Room, to: Room): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    // 수평 먼저, 그 다음 수직
    if (Math.random() < 0.5) {
      // 수평 이동
      const startX = from.centerX;
      const endX = to.centerX;
      const y = from.centerY;

      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        points.push({ x, y });
      }

      // 수직 이동
      const x = to.centerX;
      const startY = from.centerY;
      const endY = to.centerY;

      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        points.push({ x, y });
      }
    } else {
      // 수직 먼저, 그 다음 수평
      const startY = from.centerY;
      const endY = to.centerY;
      const x = from.centerX;

      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        points.push({ x, y });
      }

      // 수평 이동
      const y = to.centerY;
      const startX = from.centerX;
      const endX = to.centerX;

      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        points.push({ x, y });
      }
    }

    return points;
  }
}

/**
 * BSP 트리 노드
 */
class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  leftChild: BSPNode | null = null;
  rightChild: BSPNode | null = null;
  room: Room | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * 노드를 분할
   */
  split(minRoomSize: number): boolean {
    // 이미 분할되었으면 false
    if (this.leftChild !== null || this.rightChild !== null) {
      return false;
    }

    // 분할 방향 결정 (가로가 더 길면 수직 분할, 세로가 더 길면 수평 분할)
    const splitHorizontally = Math.random() > 0.5;

    // 분할 가능한지 확인
    const max = (splitHorizontally ? this.height : this.width) - minRoomSize;
    if (max <= minRoomSize) {
      return false; // 분할 불가능
    }

    // 분할 위치 결정
    const split = Phaser.Math.Between(minRoomSize, max);

    if (splitHorizontally) {
      // 수평 분할
      this.leftChild = new BSPNode(this.x, this.y, this.width, split);
      this.rightChild = new BSPNode(this.x, this.y + split, this.width, this.height - split);
    } else {
      // 수직 분할
      this.leftChild = new BSPNode(this.x, this.y, split, this.height);
      this.rightChild = new BSPNode(this.x + split, this.y, this.width - split, this.height);
    }

    return true;
  }

  /**
   * 리프 노드에 방 생성
   */
  createRoom(): void {
    if (this.leftChild !== null || this.rightChild !== null) {
      // 리프 노드가 아니면 자식 노드에서 방 생성
      if (this.leftChild !== null) {
        this.leftChild.createRoom();
      }
      if (this.rightChild !== null) {
        this.rightChild.createRoom();
      }
    } else {
      // 리프 노드에서 방 생성
      const roomWidth = Phaser.Math.Between(
        Math.floor(this.width * 0.5),
        Math.max(Math.floor(this.width * 0.8), Math.floor(this.width * 0.5) + 1)
      );
      const roomHeight = Phaser.Math.Between(
        Math.floor(this.height * 0.5),
        Math.max(Math.floor(this.height * 0.8), Math.floor(this.height * 0.5) + 1)
      );

      const roomX = this.x + Phaser.Math.Between(1, this.width - roomWidth - 1);
      const roomY = this.y + Phaser.Math.Between(1, this.height - roomHeight - 1);

      this.room = new Room(roomX, roomY, roomWidth, roomHeight);
    }
  }

  /**
   * 모든 방 가져오기
   */
  getRooms(): Room[] {
    const rooms: Room[] = [];

    if (this.room !== null) {
      rooms.push(this.room);
    }

    if (this.leftChild !== null) {
      rooms.push(...this.leftChild.getRooms());
    }

    if (this.rightChild !== null) {
      rooms.push(...this.rightChild.getRooms());
    }

    return rooms;
  }

  /**
   * 노드의 대표 방 가져오기 (복도 연결용)
   */
  getRoom(): Room | null {
    if (this.room !== null) {
      return this.room;
    }

    let leftRoom: Room | null = null;
    let rightRoom: Room | null = null;

    if (this.leftChild !== null) {
      leftRoom = this.leftChild.getRoom();
    }

    if (this.rightChild !== null) {
      rightRoom = this.rightChild.getRoom();
    }

    // 랜덤하게 왼쪽이나 오른쪽 방 반환
    if (leftRoom === null) {
      return rightRoom;
    }
    if (rightRoom === null) {
      return leftRoom;
    }

    return Math.random() < 0.5 ? leftRoom : rightRoom;
  }
}

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;
  private tiles: TileType[][];
  private rooms: Room[] = [];
  private corridors: Corridor[] = [];
  private startRoom: Room | null = null;
  private bossRoom: Room | null = null;
  private rootNode: BSPNode | null = null;

  constructor(scene: Phaser.Scene, width: number = GameConfig.dungeon.width, height: number = GameConfig.dungeon.height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tiles = [];
  }

  /**
   * BSP 알고리즘을 사용하여 던전 생성
   */
  generate(): TileType[][] {
    // 초기화 - 모든 타일을 벽으로
    this.tiles = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(TileType.WALL)
    );

    this.rooms = [];
    this.corridors = [];

    // BSP 트리 생성
    this.rootNode = new BSPNode(1, 1, this.width - 2, this.height - 2);

    // 트리 분할 (15-25개 방 생성 목표)
    this.splitNode(this.rootNode, 0);

    // 각 리프 노드에 방 생성
    this.rootNode.createRoom();

    // 모든 방 수집
    this.rooms = this.rootNode.getRooms();

    // 복도 생성
    this.createCorridors(this.rootNode);

    // 타일맵에 방 그리기
    this.drawRooms();

    // 타일맵에 복도 그리기
    this.drawCorridors();

    // 문 추가
    this.addDoors();

    // 시작 방과 보스 방 지정
    this.designateSpecialRooms();

    return this.tiles;
  }

  /**
   * BSP 노드를 재귀적으로 분할
   */
  private splitNode(node: BSPNode, depth: number): void {
    const maxDepth = 4; // 최대 분할 깊이
    const minRoomSize = 8; // 최소 방 크기

    // 방이 충분히 생성되었는지 확인
    if (depth >= maxDepth) {
      return;
    }

    // 노드 분할
    if (node.split(minRoomSize)) {
      // 분할 성공하면 자식 노드도 분할
      if (node.leftChild !== null) {
        this.splitNode(node.leftChild, depth + 1);
      }
      if (node.rightChild !== null) {
        this.splitNode(node.rightChild, depth + 1);
      }
    }
  }

  /**
   * 복도 생성 (재귀적으로 형제 노드 연결)
   */
  private createCorridors(node: BSPNode): void {
    if (node.leftChild === null || node.rightChild === null) {
      return; // 리프 노드면 종료
    }

    // 왼쪽과 오른쪽 자식의 대표 방 가져오기
    const leftRoom = node.leftChild.getRoom();
    const rightRoom = node.rightChild.getRoom();

    if (leftRoom !== null && rightRoom !== null) {
      // 두 방을 연결하는 복도 생성
      const corridor = new Corridor(leftRoom, rightRoom);
      this.corridors.push(corridor);
    }

    // 재귀적으로 자식 노드의 복도 생성
    this.createCorridors(node.leftChild);
    this.createCorridors(node.rightChild);
  }

  /**
   * 타일맵에 방 그리기
   */
  private drawRooms(): void {
    for (const room of this.rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = TileType.FLOOR;
          }
        }
      }
    }
  }

  /**
   * 타일맵에 복도 그리기
   */
  private drawCorridors(): void {
    for (const corridor of this.corridors) {
      for (const point of corridor.points) {
        const { x, y } = point;

        // 복도와 주변 1칸을 바닥으로
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              this.tiles[ny][nx] = TileType.FLOOR;
            }
          }
        }
      }
    }
  }

  /**
   * 문 추가
   */
  private addDoors(): void {
    // 각 복도의 시작점과 끝점 근처에 문 추가
    for (const corridor of this.corridors) {
      if (corridor.points.length < 2) continue;

      // 복도의 시작 부분에 문 찾기
      const start = corridor.points[0];
      this.tryPlaceDoor(start.x, start.y);

      // 복도의 끝 부분에 문 찾기
      const end = corridor.points[corridor.points.length - 1];
      this.tryPlaceDoor(end.x, end.y);
    }
  }

  /**
   * 특정 위치 근처에 문 배치 시도
   */
  private tryPlaceDoor(x: number, y: number): void {
    // 주변 탐색
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx <= 0 || nx >= this.width - 1 || ny <= 0 || ny >= this.height - 1) {
          continue;
        }

        // 이미 바닥이면서 수평 또는 수직으로 벽-바닥-벽 패턴인 경우 문 배치
        if (this.tiles[ny][nx] === TileType.FLOOR) {
          // 수평 체크
          if (
            this.tiles[ny][nx - 1] === TileType.WALL &&
            this.tiles[ny][nx + 1] === TileType.WALL &&
            this.tiles[ny - 1][nx] === TileType.FLOOR &&
            this.tiles[ny + 1][nx] === TileType.FLOOR
          ) {
            this.tiles[ny][nx] = TileType.DOOR;
            return;
          }

          // 수직 체크
          if (
            this.tiles[ny - 1][nx] === TileType.WALL &&
            this.tiles[ny + 1][nx] === TileType.WALL &&
            this.tiles[ny][nx - 1] === TileType.FLOOR &&
            this.tiles[ny][nx + 1] === TileType.FLOOR
          ) {
            this.tiles[ny][nx] = TileType.DOOR;
            return;
          }
        }
      }
    }
  }

  /**
   * 시작 방과 보스 방 지정 (가장 먼 거리)
   */
  private designateSpecialRooms(): void {
    if (this.rooms.length < 2) {
      this.startRoom = this.rooms[0] || null;
      this.bossRoom = this.rooms[0] || null;
      return;
    }

    let maxDistance = 0;
    let farthestPair: [Room, Room] | null = null;

    // 모든 방 쌍의 거리 계산
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const distance = this.rooms[i].distanceTo(this.rooms[j]);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestPair = [this.rooms[i], this.rooms[j]];
        }
      }
    }

    if (farthestPair !== null) {
      this.startRoom = farthestPair[0];
      this.bossRoom = farthestPair[1];
    }
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
    const tile = this.getTileAt(x, y);
    return tile === TileType.FLOOR || tile === TileType.DOOR;
  }

  /**
   * 플레이어 스폰 위치 (시작 방 중앙)
   */
  getSpawnPosition(): { x: number, y: number } {
    if (this.startRoom === null) {
      return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    }

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    return {
      x: this.startRoom.centerX * tileSize,
      y: this.startRoom.centerY * tileSize
    };
  }

  /**
   * 보스 방 위치
   */
  getBossRoomPosition(): { x: number, y: number } {
    if (this.bossRoom === null) {
      return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    }

    const tileSize = GameConfig.tile.size * GameConfig.tile.scale;
    return {
      x: this.bossRoom.centerX * tileSize,
      y: this.bossRoom.centerY * tileSize
    };
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  getStartRoom(): Room | null {
    return this.startRoom;
  }

  getBossRoom(): Room | null {
    return this.bossRoom;
  }
}
