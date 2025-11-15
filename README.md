# 🎮 Roguelike ARPG

디아블로 스타일의 로그라이크 액션 RPG 웹게임입니다.

## 🛠️ 기술 스택

- **Phaser 3** - 게임 엔진
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 빌드 도구

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 16+ 설치 필요

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 자동 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 프리뷰
```bash
npm run preview
```

## 🎯 기능

### 현재 구현된 기능
- ✅ 10x10 타일 기반 던전
- ✅ WASD/화살표 키로 플레이어 이동
- ✅ 카메라 플레이어 추적
- ✅ 적 생성
- ✅ UI 오버레이 (HP, FPS, 조작법)
- ✅ 픽셀 퍼펙트 렌더링 (16x16 타일, 2배 확대)

### 조작법
- **이동**: WASD 또는 화살표 키
- **ESC**: 일시정지 (예정)

## 📁 프로젝트 구조

```
roguelike-rpg/
├── index.html              # HTML 진입점
├── package.json            # 의존성 관리
├── vite.config.ts          # Vite 설정
├── tsconfig.json           # TypeScript 설정
├── src/
│   ├── main.ts             # 게임 진입점
│   ├── scenes/             # 게임 씬들
│   │   ├── BootScene.ts    # 에셋 로딩
│   │   ├── GameScene.ts    # 메인 게임
│   │   └── UIScene.ts      # UI 오버레이
│   ├── entities/           # 게임 엔티티
│   │   ├── Player.ts       # 플레이어
│   │   └── Enemy.ts        # 적
│   ├── systems/            # 게임 시스템
│   │   ├── DungeonGenerator.ts  # 던전 생성
│   │   ├── CombatSystem.ts      # 전투
│   │   └── LootSystem.ts        # 아이템
│   └── config/
│       └── GameConfig.ts   # 게임 설정
└── assets/
    └── sprites/            # 스프라이트 에셋
```

## 🎨 에셋

현재는 Phaser Graphics API로 프로그래밍 방식으로 그래픽을 생성합니다.

### 외부 에셋 사용하기 (선택사항)

**Kenney.nl**에서 무료 픽셀아트 에셋을 다운로드할 수 있습니다:

1. [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) 다운로드
2. [Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-pack) 다운로드
3. `assets/sprites/` 폴더에 압축 해제
4. `BootScene.ts`에서 에셋 로딩 코드 활성화

## 🚀 향후 계획

- [ ] 프로시저럴 던전 생성 개선
- [ ] 전투 시스템 구현
- [ ] 아이템 및 인벤토리 시스템
- [ ] 경험치 및 레벨업
- [ ] 다양한 적 타입
- [ ] 보스 전투
- [ ] 사운드 및 음악
- [ ] 세이브/로드 기능

## 📝 라이선스

MIT

## 🙏 크레딧

- Phaser 3 게임 엔진
- Kenney.nl (에셋 제공)