# 🎮 Dark Dungeon - Roguelike ARPG

디아블로 스타일의 다크 판타지 로그라이크 액션 RPG 웹게임입니다.

## 🎮 플레이하기

**[여기에서 게임 플레이](https://jeongjinyong.github.io/test_web_game/)**

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

### 핵심 시스템
- ✅ **프로시저럴 던전 생성** (BSP 알고리즘)
- ✅ **전투 시스템** (마우스 클릭 공격, 크리티컬)
- ✅ **다크 판타지 비주얼** (동적 조명, 횃불, 파티클 효과)
- ✅ **인벤토리 시스템** (무기, 방어구, 반지, 포션)
- ✅ **루트 시스템** (아이템 드롭, 레어도)
- ✅ **층 시스템** (무한 던전, 최고 층수 기록)
- ✅ **보스전** (각 층마다 보스 처치 후 다음 층 진입)
- ✅ **미니맵** (탐험한 방 추적, 현재 위치 표시)
- ✅ **대쉬 스킬** (Space키, 0.3초 무적, 5초 쿨타임)

### 게임 특징
- 🎭 **다양한 적 타입**: 슬라임, 스켈레톤, 데몬, 보스
- 🗡️ **아이템 시스템**: 무기(공격력), 방어구(HP), 반지(크리티컬), 포션(회복)
- 🏆 **최고 기록**: 로컬스토리지에 최고 도달 층수 저장
- 💀 **게임오버**: 죽으면 1층부터 다시 시작
- 🎨 **다크 판타지 분위기**: 어두운 조명, 피 파티클, 다크 컬러

### 조작법
- **이동**: WASD 또는 화살표 키
- **공격**: 마우스 좌클릭 (방향으로 공격)
- **대쉬**: Space (쿨타임 5초, 0.3초 무적)
- **아이템 줍기**: E
- **인벤토리**: I
- **던전 재생성**: F5 (디버그용)

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

## 🚀 향후 개선 계획

- [ ] 경험치 및 레벨업 시스템
- [ ] 더 다양한 적 타입 및 보스
- [ ] 스킬 트리 시스템
- [ ] 배경음악 및 효과음 개선
- [ ] 세이브/로드 기능 (클라우드 저장)
- [ ] 멀티플레이어 모드
- [ ] 업적 시스템

## 🔧 최적화

- ✅ 화면 밖 적 비활성화 (컬링)
- ✅ 60fps 유지
- ✅ 자동 GitHub Pages 배포

## 📝 라이선스

MIT

## 🙏 크레딧

- Phaser 3 게임 엔진
- Kenney.nl (에셋 제공)