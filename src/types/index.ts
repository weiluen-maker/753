export type IngredientCategory =
  | '蔬菜'
  | '肉品'
  | '海鮮'
  | '蛋豆製品'
  | '乳製品'
  | '醬料調味'
  | '水果'
  | '主食'
  | '其他';

export type StorageLocation = '冷藏' | '冷凍' | '常溫';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  expiryDate?: string; // YYYY-MM-DD
  storageLocation: StorageLocation;
  confidence?: number; // 0.0 ~ 1.0
  isEstimatedQuantity?: boolean;
  boundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CookingDevice =
  | '電鍋'
  | '氣炸鍋'
  | '微波爐'
  | '單口瓦斯爐'
  | '烤箱'
  | '平底鍋/雙口爐';

export type DietaryStyle =
  | '一般均衡'
  | '高蛋白'
  | '低醣'
  | '生酮'
  | '全素'
  | '海鮮素';

export interface UserPreference {
  userId?: string;
  availableDevices: CookingDevice[];
  dietaryStyles: DietaryStyle[];
  excludedIngredients: string[];
  maxCookingMinutes: number; // 15, 30, 45, or 999
  servings: number;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  isFromInventory: boolean;
  inventoryIngredientId?: string;
  inventoryDeductionAmount: number;
  notes?: string;
}

export interface ExtraIngredient {
  name: string;
  amount: string;
  optional?: boolean;
}

export interface SubstituteSuggestion {
  original: string;
  substitute: string;
  note: string;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

export interface EstimatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  label: string; // 估算值
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  requiredDevices: CookingDevice[];
  dietaryTags: string[];
  ingredients: RecipeIngredient[];
  extraIngredientsNeeded: ExtraIngredient[];
  substitutes: SubstituteSuggestion[];
  steps: RecipeStep[];
  estimatedNutrition: EstimatedNutrition;
  constraintValidation: {
    devicesValid: boolean;
    dietaryValid: boolean;
    timeValid: boolean;
    explanation: string;
  };
  createdAt?: string;
}

export interface CookingSession {
  id: string;
  recipeId: string;
  recipeName: string;
  status: 'preparing' | 'cooking' | 'completed' | 'cancelled';
  actualIngredients: Array<{
    ingredientId?: string;
    name: string;
    deductionAmount: number;
    unit: string;
    used: boolean;
  }>;
  startedAt: string;
  completedAt?: string;
}

export type TransactionReason =
  | 'photo_recognize'
  | 'cooking_deduct'
  | 'manual_add'
  | 'manual_edit'
  | 'revert';

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  ingredientName: string;
  cookingSessionId?: string;
  quantityDelta: number; // e.g. -2 or +3
  unit: string;
  reason: TransactionReason;
  description: string;
  createdAt: string;
}

export interface RecognitionItem {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  confidence: number;
  isEstimatedQuantity: boolean;
  storageLocation: StorageLocation;
  suggestedExpiryDays?: number;
  notes?: string;
  isConfirmed: boolean;
  isDuplicate?: boolean;
  duplicateAction?: 'merge' | 'add_new';
  existingIngredientId?: string;
  boundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}
