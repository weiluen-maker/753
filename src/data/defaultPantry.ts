import { Ingredient, UserPreference } from '../types';

export const initialPreferences: UserPreference = {
  availableDevices: ['電鍋', '微波爐', '單口瓦斯爐', '平底鍋/雙口爐'],
  dietaryStyles: ['高蛋白'],
  excludedIngredients: ['苦瓜'],
  maxCookingMinutes: 15,
  servings: 2,
};

export const defaultIngredients: Ingredient[] = [
  {
    id: 'ing-1',
    name: '雞蛋',
    category: '蛋豆製品',
    quantity: 8,
    unit: '顆',
    expiryDate: getFutureDate(10),
    storageLocation: '冷藏',
    confidence: 0.98,
    notes: '新鮮冷藏放牧蛋',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-2',
    name: '嫩豆腐',
    category: '蛋豆製品',
    quantity: 2,
    unit: '盒',
    expiryDate: getFutureDate(3),
    storageLocation: '冷藏',
    confidence: 0.95,
    notes: '即期特價，建議優先食用',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-3',
    name: '高麗菜',
    category: '蔬菜',
    quantity: 1,
    unit: '顆',
    expiryDate: getFutureDate(6),
    storageLocation: '冷藏',
    confidence: 0.92,
    isEstimatedQuantity: true,
    notes: '半顆已切，包覆保鮮膜',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-4',
    name: '雞胸肉',
    category: '肉品',
    quantity: 3,
    unit: '片',
    expiryDate: getFutureDate(2),
    storageLocation: '冷藏',
    confidence: 0.89,
    notes: '冷藏生鮮雞胸，即期需盡快料理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-5',
    name: '鮮奶',
    category: '乳製品',
    quantity: 1,
    unit: '瓶',
    expiryDate: getFutureDate(5),
    storageLocation: '冷藏',
    confidence: 0.96,
    notes: '全脂純鮮乳 936ml',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-6',
    name: '洋蔥',
    category: '蔬菜',
    quantity: 2,
    unit: '顆',
    expiryDate: getFutureDate(14),
    storageLocation: '常溫',
    confidence: 0.94,
    notes: '黃洋蔥',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-7',
    name: '牛番茄',
    category: '蔬菜',
    quantity: 3,
    unit: '顆',
    expiryDate: getFutureDate(4),
    storageLocation: '冷藏',
    confidence: 0.91,
    notes: '成熟紅番茄',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ing-8',
    name: '特級黑胡椒牛肉片',
    category: '肉品',
    quantity: 1,
    unit: '包',
    expiryDate: getFutureDate(30),
    storageLocation: '冷凍',
    confidence: 0.93,
    notes: '冷凍庫備用肉品 200g',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Preset fridge demo scenes with realistic photos/illustrations
export interface PresetFridgeSample {
  id: string;
  title: string;
  subtitle: string;
  image: string; // Base64 or Data URI
  sampleCount: number;
  description: string;
}

// Crisp inline SVG data URLs representing realistic fridge scenes for instant testing
export const sampleFridgePresets: PresetFridgeSample[] = [
  {
    id: 'sample-family',
    title: '家庭日常冰箱',
    subtitle: '多樣蔬菜、蛋、肉品、鮮乳',
    description: '標準雙門冰箱中層，包含雞蛋、高麗菜、嫩豆腐、鮮奶與雞肉。',
    sampleCount: 6,
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="%23e2e8f0"/>
          <stop offset="100%" stop-color="%23cbd5e1"/>
        </linearGradient>
        <linearGradient id="shelf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="%2394a3b8"/>
          <stop offset="100%" stop-color="%2364748b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(%23bg)"/>
      <rect x="20" y="20" width="560" height="360" rx="16" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="4"/>
      <!-- Shelves -->
      <line x1="20" y1="140" x2="580" y2="140" stroke="url(%23shelf)" stroke-width="8"/>
      <line x1="20" y1="260" x2="580" y2="260" stroke="url(%23shelf)" stroke-width="8"/>
      <!-- Top Shelf: Eggs and Milk -->
      <rect x="60" y="70" width="160" height="60" rx="8" fill="%23fef3c7" stroke="%23f59e0b" stroke-width="2"/>
      <text x="140" y="105" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%23b45309" text-anchor="middle">🥚 雞蛋 (6顆裝)</text>
      <rect x="250" y="45" width="65" height="85" rx="6" fill="%23e0f2fe" stroke="%230284c7" stroke-width="2"/>
      <text x="282" y="92" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%230369a1" text-anchor="middle">🥛 鮮乳</text>
      <rect x="340" y="60" width="120" height="70" rx="6" fill="%23fbcfe8" stroke="%23db2777" stroke-width="2"/>
      <text x="400" y="100" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%239d174d" text-anchor="middle">🥓 培根火腿</text>
      <!-- Middle Shelf: Tofu and Chicken -->
      <rect x="60" y="180" width="130" height="70" rx="6" fill="%23f1f5f9" stroke="%2364748b" stroke-width="2"/>
      <text x="125" y="220" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23334155" text-anchor="middle">🧊 嫩豆腐 (1盒)</text>
      <rect x="220" y="170" width="160" height="80" rx="8" fill="%23fee2e2" stroke="%23ef4444" stroke-width="2"/>
      <text x="300" y="215" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23b91c1c" text-anchor="middle">🍗 雞胸肉切片</text>
      <rect x="410" y="175" width="110" height="75" rx="6" fill="%23fef9c3" stroke="%23ca8a04" stroke-width="2"/>
      <text x="465" y="218" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%23854d0e" text-anchor="middle">🧀 起司片</text>
      <!-- Bottom Crisper Drawer -->
      <rect x="40" y="275" width="240" height="95" rx="10" fill="%23dcfce7" stroke="%2316a34a" stroke-width="2"/>
      <text x="160" y="330" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%2315803d" text-anchor="middle">🥬 高麗菜與葉菜盒</text>
      <rect x="300" y="275" width="240" height="95" rx="10" fill="%23ffedd5" stroke="%23ea580c" stroke-width="2"/>
      <text x="420" y="330" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%23c2410c" text-anchor="middle">🥕 胡蘿蔔與番茄</text>
    </svg>`,
  },
  {
    id: 'sample-fitness',
    title: '健身增肌高蛋白冰箱',
    subtitle: '雞胸肉、雞蛋、希臘優格、菠菜',
    description: '專為高蛋白增肌飲食設計，富含優質動物性與植物性蛋白。',
    sampleCount: 5,
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="%23f1f5f9"/>
      <rect x="20" y="20" width="560" height="360" rx="16" fill="%23ffffff" stroke="%230ea5e9" stroke-width="4"/>
      <line x1="20" y1="150" x2="580" y2="150" stroke="%23cbd5e1" stroke-width="6"/>
      <line x1="20" y1="270" x2="580" y2="270" stroke="%23cbd5e1" stroke-width="6"/>
      <!-- Top -->
      <rect x="50" y="60" width="200" height="80" rx="8" fill="%23fee2e2" stroke="%23dc2626" stroke-width="2"/>
      <text x="150" y="105" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%23991b1b" text-anchor="middle">🥩 舒肥雞胸肉 4入</text>
      <rect x="280" y="55" width="140" height="85" rx="8" fill="%23fef3c7" stroke="%23f59e0b" stroke-width="2"/>
      <text x="350" y="105" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23b45309" text-anchor="middle">🥚 放牧蛋 10顆</text>
      <rect x="440" y="65" width="100" height="75" rx="8" fill="%23e0e7ff" stroke="%234f46e5" stroke-width="2"/>
      <text x="490" y="110" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%233730a3" text-anchor="middle">🥣 優格</text>
      <!-- Middle -->
      <rect x="60" y="175" width="160" height="80" rx="8" fill="%23dcfce7" stroke="%2316a34a" stroke-width="2"/>
      <text x="140" y="220" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%2315803d" text-anchor="middle">🥬 有機菠菜一把</text>
      <rect x="250" y="175" width="140" height="80" rx="8" fill="%23fef9c3" stroke="%23eab308" stroke-width="2"/>
      <text x="320" y="220" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23854d0e" text-anchor="middle">🧊 板豆腐 2塊</text>
      <!-- Bottom -->
      <rect x="80" y="290" width="440" height="80" rx="8" fill="%23f0fdf4" stroke="%2322c55e" stroke-width="2"/>
      <text x="300" y="338" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%23166534" text-anchor="middle">🥦 青花菜與彩椒保鮮盒</text>
    </svg>`,
  },
  {
    id: 'sample-studio',
    title: '租屋族省時小冰箱',
    subtitle: '微波豆腐、雞蛋、即食火腿、玉米',
    description: '針對單人套房、免開火或僅有微波爐/電鍋的簡易食材組合。',
    sampleCount: 4,
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="%23f8fafc"/>
      <rect x="40" y="20" width="520" height="360" rx="14" fill="%23ffffff" stroke="%2364748b" stroke-width="3"/>
      <line x1="40" y1="180" x2="560" y2="180" stroke="%23e2e8f0" stroke-width="5"/>
      <!-- Top -->
      <rect x="70" y="60" width="180" height="90" rx="8" fill="%23fef3c7" stroke="%23f59e0b" stroke-width="2"/>
      <text x="160" y="110" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="%23b45309" text-anchor="middle">🥚 雞蛋 4顆</text>
      <rect x="290" y="65" width="210" height="85" rx="8" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="2"/>
      <text x="395" y="112" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23334155" text-anchor="middle">🧊 中華嫩豆腐 1盒</text>
      <!-- Bottom -->
      <rect x="70" y="210" width="190" height="110" rx="8" fill="%23fee2e2" stroke="%23ef4444" stroke-width="2"/>
      <text x="165" y="270" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23991b1b" text-anchor="middle">🥓 即食三明治火腿</text>
      <rect x="290" y="210" width="210" height="110" rx="8" fill="%23fef08a" stroke="%23ca8a04" stroke-width="2"/>
      <text x="395" y="270" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="%23713f12" text-anchor="middle">🌽 甜玉米粒罐頭</text>
    </svg>`,
  },
];
