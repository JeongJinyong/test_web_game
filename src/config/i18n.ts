/**
 * 다국어 지원 시스템
 * 브라우저 언어를 자동 감지하고 해당 언어로 UI를 표시합니다.
 */

export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface Translations {
  // UI 일반
  title: string;
  floor: string;
  vitality: string;
  inventory: string;
  equipment: string;
  items: string;
  slots: string;

  // 컨트롤
  controls: {
    title: string;
    move: string;
    attack: string;
    dash: string;
    pickup: string;
    inventory: string;
  };

  // 장비 슬롯
  equipmentSlots: {
    weapon: string;
    armor: string;
    ring: string;
  };

  // 아이템 타입
  itemTypes: {
    weapon: string;
    armor: string;
    ring: string;
    potion: string;
  };

  // 아이템 등급
  rarity: {
    common: string;
    rare: string;
    epic: string;
    legendary: string;
  };

  // 스탯 설명
  stats: {
    attackDamage: string;
    maxHP: string;
    criticalChance: string;
    restoreHP: string;
  };

  // 게임 메시지
  messages: {
    inventoryFull: string;
    cannotEquip: string;
    cannotUnequip: string;
    floorCleared: string;
    youDied: string;
    reachedFloor: string;
    bestFloor: string;
    restart: string;
    critical: string;
  };

  // 액션
  actions: {
    use: string;
    equip: string;
    unequip: string;
    leftClick: string;
    rightClick: string;
  };
}

const translations: Record<Language, Translations> = {
  ko: {
    title: '어둠의 던전',
    floor: '층',
    vitality: '생명력',
    inventory: '인벤토리',
    equipment: '장비',
    items: '아이템',
    slots: '슬롯',

    controls: {
      title: '조작법',
      move: 'WASD 또는 방향키 - 이동',
      attack: '좌클릭 - 공격',
      dash: 'SPACE - 대쉬 (5초 쿨다운)',
      pickup: 'E - 아이템 줍기',
      inventory: 'I - 인벤토리',
    },

    equipmentSlots: {
      weapon: '무기',
      armor: '방어구',
      ring: '반지',
    },

    itemTypes: {
      weapon: '무기',
      armor: '방어구',
      ring: '반지',
      potion: '포션',
    },

    rarity: {
      common: '일반',
      rare: '희귀',
      epic: '영웅',
      legendary: '전설',
    },

    stats: {
      attackDamage: '공격력',
      maxHP: '최대 체력',
      criticalChance: '치명타 확률',
      restoreHP: '체력 회복',
    },

    messages: {
      inventoryFull: '인벤토리가 가득 찼습니다!',
      cannotEquip: '장착할 수 없습니다: 인벤토리가 가득 참',
      cannotUnequip: '장착 해제할 수 없습니다: 인벤토리가 가득 함',
      floorCleared: '층 클리어!',
      youDied: '사망',
      reachedFloor: '도달한 층',
      bestFloor: '최고 기록',
      restart: 'R을 눌러 1층부터 다시 시작',
      critical: '치명타!',
    },

    actions: {
      use: '사용',
      equip: '장착',
      unequip: '해제',
      leftClick: '좌클릭',
      rightClick: '우클릭',
    },
  },

  en: {
    title: 'Dark Dungeon',
    floor: 'Floor',
    vitality: 'Vitality',
    inventory: 'Inventory',
    equipment: 'Equipment',
    items: 'Items',
    slots: 'Slots',

    controls: {
      title: 'Controls',
      move: 'WASD or Arrow Keys - Move',
      attack: 'Left Click - Attack',
      dash: 'SPACE - Dash (5s cooldown)',
      pickup: 'E - Pick up Item',
      inventory: 'I - Inventory',
    },

    equipmentSlots: {
      weapon: 'Weapon',
      armor: 'Armor',
      ring: 'Ring',
    },

    itemTypes: {
      weapon: 'Weapon',
      armor: 'Armor',
      ring: 'Ring',
      potion: 'Potion',
    },

    rarity: {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    },

    stats: {
      attackDamage: 'Attack Damage',
      maxHP: 'Max HP',
      criticalChance: 'Critical Chance',
      restoreHP: 'Restore HP',
    },

    messages: {
      inventoryFull: 'Inventory is full!',
      cannotEquip: 'Cannot equip: inventory full',
      cannotUnequip: 'Cannot unequip: inventory full',
      floorCleared: 'Floor Cleared!',
      youDied: 'You Died',
      reachedFloor: 'Reached Floor',
      bestFloor: 'Best Floor',
      restart: 'Press R to Restart from Floor 1',
      critical: 'CRITICAL!',
    },

    actions: {
      use: 'Use',
      equip: 'Equip',
      unequip: 'Unequip',
      leftClick: 'Left Click',
      rightClick: 'Right Click',
    },
  },

  ja: {
    title: '闇のダンジョン',
    floor: '階',
    vitality: '生命力',
    inventory: 'インベントリ',
    equipment: '装備',
    items: 'アイテム',
    slots: 'スロット',

    controls: {
      title: '操作方法',
      move: 'WASDまたは矢印キー - 移動',
      attack: '左クリック - 攻撃',
      dash: 'SPACE - ダッシュ (5秒クールダウン)',
      pickup: 'E - アイテム拾う',
      inventory: 'I - インベントリ',
    },

    equipmentSlots: {
      weapon: '武器',
      armor: '防具',
      ring: '指輪',
    },

    itemTypes: {
      weapon: '武器',
      armor: '防具',
      ring: '指輪',
      potion: 'ポーション',
    },

    rarity: {
      common: '一般',
      rare: 'レア',
      epic: 'エピック',
      legendary: '伝説',
    },

    stats: {
      attackDamage: '攻撃力',
      maxHP: '最大HP',
      criticalChance: 'クリティカル確率',
      restoreHP: 'HP回復',
    },

    messages: {
      inventoryFull: 'インベントリがいっぱいです!',
      cannotEquip: '装備できません: インベントリがいっぱい',
      cannotUnequip: '外せません: インベントリがいっぱい',
      floorCleared: '階クリア!',
      youDied: '死亡',
      reachedFloor: '到達階',
      bestFloor: '最高記録',
      restart: 'Rキーを押して1階から再スタート',
      critical: 'クリティカル!',
    },

    actions: {
      use: '使用',
      equip: '装備',
      unequip: '外す',
      leftClick: '左クリック',
      rightClick: '右クリック',
    },
  },

  zh: {
    title: '黑暗地牢',
    floor: '层',
    vitality: '生命值',
    inventory: '背包',
    equipment: '装备',
    items: '物品',
    slots: '格子',

    controls: {
      title: '操作',
      move: 'WASD或方向键 - 移动',
      attack: '左键 - 攻击',
      dash: 'SPACE - 冲刺 (5秒冷却)',
      pickup: 'E - 拾取物品',
      inventory: 'I - 背包',
    },

    equipmentSlots: {
      weapon: '武器',
      armor: '护甲',
      ring: '戒指',
    },

    itemTypes: {
      weapon: '武器',
      armor: '护甲',
      ring: '戒指',
      potion: '药水',
    },

    rarity: {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    },

    stats: {
      attackDamage: '攻击力',
      maxHP: '最大生命值',
      criticalChance: '暴击率',
      restoreHP: '恢复生命值',
    },

    messages: {
      inventoryFull: '背包已满!',
      cannotEquip: '无法装备: 背包已满',
      cannotUnequip: '无法卸下: 背包已满',
      floorCleared: '层已清除!',
      youDied: '你死了',
      reachedFloor: '到达层数',
      bestFloor: '最佳记录',
      restart: '按R键从第1层重新开始',
      critical: '暴击!',
    },

    actions: {
      use: '使用',
      equip: '装备',
      unequip: '卸下',
      leftClick: '左键',
      rightClick: '右键',
    },
  },
};

/**
 * I18n 클래스 - 다국어 지원
 */
export class I18n {
  private static instance: I18n;
  private currentLanguage: Language;

  private constructor() {
    this.currentLanguage = this.detectLanguage();
    console.log(`[i18n] Detected language: ${this.currentLanguage}`);
  }

  static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  /**
   * 브라우저 언어 자동 감지
   */
  private detectLanguage(): Language {
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('ko')) {
      return 'ko';
    } else if (browserLang.startsWith('ja')) {
      return 'ja';
    } else if (browserLang.startsWith('zh')) {
      return 'zh';
    } else {
      return 'en'; // 기본값은 영어
    }
  }

  /**
   * 현재 언어의 번역 가져오기
   */
  t(): Translations {
    return translations[this.currentLanguage];
  }

  /**
   * 현재 언어 가져오기
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * 언어 변경
   */
  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    console.log(`[i18n] Language changed to: ${lang}`);
  }
}

// 전역 i18n 인스턴스
export const i18n = I18n.getInstance();
