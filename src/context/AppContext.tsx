import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CookingSession,
  Ingredient,
  InventoryTransaction,
  Recipe,
  RecognitionItem,
  UserPreference,
} from '../types';
import { defaultIngredients, initialPreferences } from '../data/defaultPantry';

interface AppContextType {
  ingredients: Ingredient[];
  preferences: UserPreference;
  recipes: Recipe[];
  activeCookingSession: CookingSession | null;
  transactions: InventoryTransaction[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Inventory actions
  addOrUpdateIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteIngredient: (id: string) => void;
  adjustIngredientQuantity: (id: string, delta: number) => void;
  confirmRecognizedItems: (items: RecognitionItem[]) => { added: number; updated: number };
  resetPantryToDefault: () => void;
  clearPantry: () => void;

  // Preferences actions
  updatePreferences: (newPreferences: Partial<UserPreference>) => void;

  // Recipes actions
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  updateSingleRecipe: (newRecipe: Recipe, originalId: string) => void;

  // Cooking & Inventory deduction
  startCooking: (recipe: Recipe) => void;
  cancelCooking: () => void;
  finishCookingAndDeduct: (
    sessionId: string,
    actualUsages: Array<{
      ingredientId?: string;
      name: string;
      deductionAmount: number;
      unit: string;
      used: boolean;
    }>
  ) => { success: boolean; error?: string };

  // Transaction history & revert
  revertTransaction: (transactionId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  INGREDIENTS: 'bingxiang_ai_ingredients_v1',
  PREFERENCES: 'bingxiang_ai_preferences_v1',
  RECIPES: 'bingxiang_ai_recipes_v1',
  TRANSACTIONS: 'bingxiang_ai_transactions_v1',
  COOKING_SESSION: 'bingxiang_ai_cooking_session_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial defaults
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      return saved ? JSON.parse(saved) : defaultIngredients;
    } catch {
      return defaultIngredients;
    }
  });

  const [preferences, setPreferences] = useState<UserPreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved) : initialPreferences;
    } catch {
      return initialPreferences;
    }
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCookingSession, setActiveCookingSession] = useState<CookingSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COOKING_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COOKING_SESSION, JSON.stringify(activeCookingSession));
  }, [activeCookingSession]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  const addOrUpdateIngredient = (item: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString();
    if (item.id) {
      // Update
      setIngredients((prev) =>
        prev.map((ing) =>
          ing.id === item.id
            ? {
                ...ing,
                ...item,
                updatedAt: now,
              }
            : ing
        )
      );
      showToast(`已更新食材「${item.name}」`, 'success');
    } else {
      // Create new
      const newId = 'ing-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const newIng: Ingredient = {
        ...item,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };
      setIngredients((prev) => [newIng, ...prev]);

      // Record transaction
      const trans: InventoryTransaction = {
        id: 'tx-' + Date.now(),
        ingredientId: newId,
        ingredientName: item.name,
        quantityDelta: item.quantity,
        unit: item.unit,
        reason: 'manual_add',
        description: `手動新增食材 ${item.quantity} ${item.unit}`,
        createdAt: now,
      };
      setTransactions((prev) => [trans, ...prev]);
      showToast(`已新增食材「${item.name}」`, 'success');
    }
  };

  const deleteIngredient = (id: string) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target) return;
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    showToast(`已移除食材「${target.name}」`, 'info');
  };

  const adjustIngredientQuantity = (id: string, delta: number) => {
    const now = new Date().toISOString();
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        const newQty = Math.max(0, Math.round((ing.quantity + delta) * 10) / 10);
        return {
          ...ing,
          quantity: newQty,
          updatedAt: now,
        };
      })
    );
  };

  // FR-01: 照片辨識確認匯入庫存
  const confirmRecognizedItems = (items: RecognitionItem[]) => {
    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    const newTransactions: InventoryTransaction[] = [];

    setIngredients((prevList) => {
      let currentList = [...prevList];

      for (const item of items) {
        if (!item.isConfirmed) continue;

        // Check if an existing ingredient matches
        const existingIndex = currentList.findIndex(
          (ing) =>
            (item.existingIngredientId && ing.id === item.existingIngredientId) ||
            ing.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        if (existingIndex >= 0 && item.duplicateAction === 'merge') {
          // Merge quantity
          const target = currentList[existingIndex];
          const newQty = Math.round((target.quantity + item.quantity) * 10) / 10;
          currentList[existingIndex] = {
            ...target,
            quantity: newQty,
            storageLocation: item.storageLocation || target.storageLocation,
            updatedAt: now,
          };
          updatedCount++;

          newTransactions.push({
            id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            ingredientId: target.id,
            ingredientName: target.name,
            quantityDelta: item.quantity,
            unit: target.unit,
            reason: 'photo_recognize',
            description: `照片盤點合併：+${item.quantity} ${item.unit}（原 ${target.quantity} → 現 ${newQty}）`,
            createdAt: now,
          });
        } else {
          // Add as new entry
          const newId = 'ing-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
          const expiryDate = item.suggestedExpiryDays
            ? new Date(Date.now() + item.suggestedExpiryDays * 86400000).toISOString().split('T')[0]
            : undefined;

          const newIngredient: Ingredient = {
            id: newId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            expiryDate,
            storageLocation: item.storageLocation,
            confidence: item.confidence,
            isEstimatedQuantity: item.isEstimatedQuantity,
            boundingBox: item.boundingBox,
            notes: item.notes || '透過照片辨識盤點加入',
            createdAt: now,
            updatedAt: now,
          };
          currentList = [newIngredient, ...currentList];
          addedCount++;

          newTransactions.push({
            id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            ingredientId: newId,
            ingredientName: item.name,
            quantityDelta: item.quantity,
            unit: item.unit,
            reason: 'photo_recognize',
            description: `照片盤點匯入：+${item.quantity} ${item.unit}`,
            createdAt: now,
          });
        }
      }

      return currentList;
    });

    if (newTransactions.length > 0) {
      setTransactions((prev) => [...newTransactions, ...prev]);
    }

    showToast(`成功匯入庫存！新增 ${addedCount} 項、合併更新 ${updatedCount} 項`, 'success');
    return { added: addedCount, updated: updatedCount };
  };

  const resetPantryToDefault = () => {
    setIngredients(defaultIngredients);
    setTransactions([]);
    showToast('已還原為範例新鮮食材庫存', 'info');
  };

  const clearPantry = () => {
    setIngredients([]);
    showToast('已清空所有食材庫存', 'info');
  };

  const updatePreferences = (newPreferences: Partial<UserPreference>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const updateSingleRecipe = (newRecipe: Recipe, originalId: string) => {
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === originalId);
      if (idx === -1) return [newRecipe, ...prev];
      const copy = [...prev];
      copy[idx] = newRecipe;
      return copy;
    });
    showToast(`料理已替換為「${newRecipe.name}」`, 'success');
  };

  // FR-05: 烹飪開始
  const startCooking = (recipe: Recipe) => {
    const session: CookingSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      recipeId: recipe.id,
      recipeName: recipe.name,
      status: 'cooking',
      actualIngredients: recipe.ingredients.map((ing) => ({
        ingredientId: ing.inventoryIngredientId,
        name: ing.name,
        deductionAmount: ing.inventoryDeductionAmount,
        unit: ing.unit,
        used: true,
      })),
      startedAt: new Date().toISOString(),
    };
    setActiveCookingSession(session);
  };

  const cancelCooking = () => {
    setActiveCookingSession(null);
    showToast('已退出烹飪模式，未扣除任何食材。', 'info');
  };

  // FR-05: 烹飪完成與庫存扣除 (含冪等性檢查與防負數庫存驗證)
  const finishCookingAndDeduct = (
    sessionId: string,
    actualUsages: Array<{
      ingredientId?: string;
      name: string;
      deductionAmount: number;
      unit: string;
      used: boolean;
    }>
  ) => {
    // Idempotency: verify this session hasn't already been deducted
    const alreadyDeducted = transactions.some((t) => t.cookingSessionId === sessionId);
    if (alreadyDeducted) {
      return { success: false, error: '該烹飪紀錄已完成庫存扣除，不可重複提交！' };
    }

    const now = new Date().toISOString();
    const newTransactions: InventoryTransaction[] = [];
    const recipeName = activeCookingSession?.recipeName || '美味料理';

    // Validation step: Check if any usage would cause negative stock
    for (const item of actualUsages) {
      if (!item.used || item.deductionAmount <= 0) continue;
      const target = ingredients.find(
        (ing) => (item.ingredientId && ing.id === item.ingredientId) || ing.name === item.name
      );
      if (target && target.quantity < item.deductionAmount) {
        // Warning: cannot exceed available stock
        return {
          success: false,
          error: `食材「${target.name}」庫存不足（現有 ${target.quantity} ${target.unit}，預計扣除 ${item.deductionAmount} ${item.unit}），請調整實際用量！`,
        };
      }
    }

    // Apply deductions
    setIngredients((prevList) => {
      let updatedList = [...prevList];

      for (const item of actualUsages) {
        if (!item.used || item.deductionAmount <= 0) continue;

        const targetIndex = updatedList.findIndex(
          (ing) => (item.ingredientId && ing.id === item.ingredientId) || ing.name === item.name
        );

        if (targetIndex >= 0) {
          const target = updatedList[targetIndex];
          const newQty = Math.max(0, Math.round((target.quantity - item.deductionAmount) * 10) / 10);

          updatedList[targetIndex] = {
            ...target,
            quantity: newQty,
            updatedAt: now,
          };

          newTransactions.push({
            id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            ingredientId: target.id,
            ingredientName: target.name,
            cookingSessionId: sessionId,
            quantityDelta: -item.deductionAmount,
            unit: target.unit,
            reason: 'cooking_deduct',
            description: `完成料理「${recipeName}」扣除：-${item.deductionAmount} ${target.unit}（剩餘 ${newQty} ${target.unit}）`,
            createdAt: now,
          });
        }
      }

      return updatedList;
    });

    if (newTransactions.length > 0) {
      setTransactions((prev) => [...newTransactions, ...prev]);
    }

    setActiveCookingSession(null);
    showToast(`料理完成！已成功扣除 ${newTransactions.length} 項食材庫存。`, 'success');
    return { success: true };
  };

  // Revert/undo an inventory transaction
  const revertTransaction = (transactionId: string): boolean => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return false;

    const now = new Date().toISOString();

    // Reverse the delta
    const reverseDelta = -tx.quantityDelta;

    setIngredients((prev) => {
      const idx = prev.findIndex((i) => i.id === tx.ingredientId || i.name === tx.ingredientName);
      if (idx === -1) {
        // If ingredient was removed, re-add
        if (reverseDelta > 0) {
          return [
            ...prev,
            {
              id: tx.ingredientId,
              name: tx.ingredientName,
              category: '其他',
              quantity: reverseDelta,
              unit: tx.unit,
              storageLocation: '冷藏',
              createdAt: now,
              updatedAt: now,
              notes: '交易復原重新建立',
            },
          ];
        }
        return prev;
      }

      const current = prev[idx];
      const newQty = Math.max(0, Math.round((current.quantity + reverseDelta) * 10) / 10);
      const copy = [...prev];
      copy[idx] = {
        ...current,
        quantity: newQty,
        updatedAt: now,
      };
      return copy;
    });

    // Record revert transaction
    const revertTx: InventoryTransaction = {
      id: 'tx-' + Date.now(),
      ingredientId: tx.ingredientId,
      ingredientName: tx.ingredientName,
      quantityDelta: reverseDelta,
      unit: tx.unit,
      reason: 'revert',
      description: `撤銷異動 #${tx.id.substring(0, 8)}：${reverseDelta > 0 ? '+' : ''}${reverseDelta} ${tx.unit}`,
      createdAt: now,
    };

    setTransactions((prev) => [revertTx, ...prev]);
    showToast(`已成功復原食材「${tx.ingredientName}」之異動`, 'success');
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        ingredients,
        preferences,
        recipes,
        activeCookingSession,
        transactions,
        toast,
        showToast,
        addOrUpdateIngredient,
        deleteIngredient,
        adjustIngredientQuantity,
        confirmRecognizedItems,
        resetPantryToDefault,
        clearPantry,
        updatePreferences,
        setRecipes,
        updateSingleRecipe,
        startCooking,
        cancelCooking,
        finishCookingAndDeduct,
        revertTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
