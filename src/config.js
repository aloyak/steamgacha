export const STORAGE_KEYS = {
  COLLECTION: 'steam_collection',
  PACKS_REMAINING: 'packs_remaining',
  PACKS_RESET: 'packs_next_reset',
  PENDING_NEW_ACCOUNT_MIGRATION: 'pending_new_account_migration'
};

export const RARITIES = [
  'COMMON', 
  'UNCOMMON', 
  'RARE', 
  'EPIC', 
  'LEGENDARY', 
  'MYTHIC', 
  'EXOTIC',
  'CELESTIAL', 
  'UNREAL'
];

export const RARITY_RANKS = {
  UNREAL: 9,
  CELESTIAL: 8,
  EXOTIC: 7,
  MYTHIC: 6,
  LEGENDARY: 5,
  EPIC: 4,
  RARE: 3,
  UNCOMMON: 2,
  COMMON: 1
};

export const NEXT_RARITY_MAP = {
  COMMON: 'UNCOMMON',
  UNCOMMON: 'RARE',
  RARE: 'EPIC',
  EPIC: 'LEGENDARY',
  LEGENDARY: 'MYTHIC',
  MYTHIC: 'EXOTIC',
  EXOTIC: 'CELESTIAL',
  CELESTIAL: 'UNREAL'
};

export const LAB_CONFIG = {
  FUSION_SUCCESS_RATE: 97,
  REQUIRED_FOR_FUSION: 5
};

export const PACK_CONFIG = {
  MAX_PACKS: 10,
  COOLDOWN_MS: 15 * 60 * 1000,
  TYPES: {
    STANDARD: {
      id: 'standard',
      img: '/packs/boosterpack_standard.png',
      weights: [
        { rarity: 'COMMON', weight: 1 / 1.2 },
        { rarity: 'UNCOMMON', weight: 1 / 3 },
        { rarity: 'RARE', weight: 1 / 7 },
        { rarity: 'EPIC', weight: 1 / 25 },
        { rarity: 'LEGENDARY', weight: 1 / 70 },
        { rarity: 'MYTHIC', weight: 1 / 150 },
        { rarity: 'EXOTIC', weight: 1 / 300 },
        { rarity: 'CELESTIAL', weight: 1 / 600 }
      ]
    },
    SPECIAL: {
      id: 'special',
      img: '/packs/boosterpack_special.png',
      weights: [
        { rarity: 'RARE', weight: 1 / 2 },
        { rarity: 'EPIC', weight: 1 / 4 },
        { rarity: 'LEGENDARY', weight: 1 / 24 },
        { rarity: 'MYTHIC', weight: 1 / 80 },
        { rarity: 'EXOTIC', weight: 1 / 200 },
        { rarity: 'CELESTIAL', weight: 1 / 400 }
      ]
    }
  }
};