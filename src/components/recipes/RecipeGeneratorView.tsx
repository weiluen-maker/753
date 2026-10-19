import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CookingDevice,
  DietaryStyle,
  Recipe,
  UserPreference,
} from '../../types';
import {
  generatePersonalizedRecipes,
  tweakSingleRecipe,
} from '../../services/api';
import { CookingModal } from '../cooking/CookingModal';

interface RecipeGeneratorViewProps {
  onGoToScan: () => void;
}

const ALL_DEVICES: CookingDevice[] = [
  '電鍋',
  '氣炸鍋',
  '微波爐',
  '單口瓦斯爐',
  '烤箱',
  '平底鍋/雙口爐',
];

const DIETARY_STYLES: Array<{ id: DietaryStyle; label: string; desc: string }> = [
  { id: '一般均衡', label: '一般均衡', desc: '美味家常均衡料理' },
  { id: '高蛋白', label: '高蛋白 / 增肌', desc: '優先搭配優質肉蛋豆腐' },
  { id: '低醣', label: '低醣飲食', desc: '適度減少澱粉碳水' },
  { id: '生酮', label: '生酮飲食', desc: '極低醣、高優質油脂' },
  { id: '全素', label: '全素 (Vegan)', desc: '無肉、無蛋、無奶、無海鮮' },
  { id: '海鮮素', label: '海鮮素', desc: '不吃紅肉家禽，可食用海鮮蔬食' },
];

const COMMON_EXCLUSIONS = ['香菜', '苦瓜', '青椒', '茄子', '洋蔥', '大蒜', '海鮮', '堅果'];

const TIME_LIMITS = [
  { label: '⚡ 15 分鐘極速', value: 15 },
  { label: '⏱️ 30 分鐘輕鬆', value: 30 },
  { label: '🍳 45 分鐘充裕', value: 45 },
  { label: '🍲 不限時間', value: 999 },
];

export const RecipeGeneratorView: React.FC<RecipeGeneratorViewProps> = ({ onGoToScan }) => {
  const {
    ingredients,
    preferences,
    updatePreferences,
    recipes,
    setRecipes,
    updateSingleRecipe,
    startCooking,
    showToast,
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [showPreferencesPanel, setShowPreferencesPanel] = useState(false);
  const [customExclusionInput, setCustomExclusionInput] = useState('');

  // Detail view & Cooking modal
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);

  // Dynamic Tweak Modal State (FR-04)
  const [tweakingRecipe, setTweakingRecipe] = useState<Recipe | null>(null);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [isTweaking, setIsTweaking] = useState(false);
  const [previousRecipesHistory, setPreviousRecipesHistory] = useState<Record<string, Recipe>>({});

  // Device Toggle
  const toggleDevice = (device: CookingDevice) => {
    const current = preferences.availableDevices;
    let next: CookingDevice[];
    if (current.includes(device)) {
      if (current.length === 1) {
        showToast('請至少保留一項可用烹飪設備', 'error');
        return;
      }
      next = current.filter((d) => d !== device);
    } else {
      next = [...current, device];
    }
    updatePreferences({ availableDevices: next });
  };

  const selectAllDevices = () => {
    updatePreferences({ availableDevices: ALL_DEVICES });
  };

  // Dietary Toggle
  const toggleDietary = (style: DietaryStyle) => {
    let current = [...preferences.dietaryStyles];
    if (current.includes(style)) {
      current = current.filter((s) => s !== style);
      if (current.length === 0) current = ['一般均衡'];
    } else {
      // If choosing 全素, remove other conflicting diets if needed
      if (style === '全素') {
        current = ['全素'];
      } else {
        current = current.filter((s) => s !== '全素');
        current.push(style);
      }
    }
    updatePreferences({ dietaryStyles: current });
  };

  // Exclusion Toggle
  const toggleExclusion = (item: string) => {
    const current = preferences.excludedIngredients;
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    updatePreferences({ excludedIngredients: next });
  };

  const addCustomExclusion = () => {
    if (!customExclusionInput.trim()) return;
    const item = customExclusionInput.trim();
    if (!preferences.excludedIngredients.includes(item)) {
      updatePreferences({
        excludedIngredients: [...preferences.excludedIngredients, item],
      });
    }
    setCustomExclusionInput('');
  };

  // AI Recipe Generation
  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) {
      showToast('目前冰箱庫存為空，請先拍照盤點或加入食材！', 'error');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('正在盤點即期食材與可用設備...');

    try {
      setTimeout(() => {
        setGenerationStep('驗證飲食風格限制並構思菜單中...');
      }, 800);

      const res = await generatePersonalizedRecipes(ingredients, preferences);

      if (res.warning) {
        showToast(res.warning, 'info');
      }

      setRecipes(res.recipes);
      showToast(`成功生成 ${res.recipes.length} 道合規美味料理推薦！`, 'success');
      setShowPreferencesPanel(false);
    } catch (err: any) {
      console.error(err);
      showToast(`生成料理失敗: ${err.message || '請稍後重試'}`, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // FR-04: Dynamic Tweak / Replace Recipe
  const handleExecuteTweak = async (promptToUse?: string) => {
    const finalPrompt = promptToUse || tweakPrompt;
    if (!tweakingRecipe || !finalPrompt.trim()) return;

    setIsTweaking(true);
    // Save previous version for undo
    setPreviousRecipesHistory((prev) => ({
      ...prev,
      [tweakingRecipe.id]: tweakingRecipe,
    }));

    try {
      const res = await tweakSingleRecipe({
        targetRecipe: tweakingRecipe,
        userPrompt: finalPrompt.trim(),
        allRecipes: recipes,
        ingredients,
        preferences,
      });

      if (res.recipe) {
        updateSingleRecipe(res.recipe, tweakingRecipe.id);
        setTweakingRecipe(null);
        setTweakPrompt('');
      } else {
        showToast('無法依指定條件調整，請嘗試其他提示詞', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`換菜微調失敗: ${err.message}`, 'error');
    } finally {
      setIsTweaking(false);
    }
  };

  // Revert back tweaked recipe
  const handleUndoTweak = (recipeId: string) => {
    const original = previousRecipesHistory[recipeId];
    if (original) {
      updateSingleRecipe(original, recipeId);
      const copy = { ...previousRecipesHistory };
      delete copy[recipeId];
      setPreviousRecipesHistory(copy);
      showToast('已復原先前的料理食譜', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>FR-02 & FR-03 個人化料理生成</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              智慧料理推薦與換菜微調
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              依據現有庫存、您的廚房設備與飲食限制量身客製，支援對話式換菜與完成後自動扣庫存。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreferencesPanel((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>條件設定</span>
              {showPreferencesPanel ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              disabled={isGenerating}
              onClick={handleGenerateRecipes}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 推薦中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>生成專屬食譜</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Current Preferences Summary Badge Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">目前硬性條件：</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
            設備：{preferences.availableDevices.join('、')}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
            風格：{preferences.dietaryStyles.join('、')}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">
            上限：{preferences.maxCookingMinutes === 999 ? '不限時' : `${preferences.maxCookingMinutes}分鐘`}
          </span>
          {preferences.excludedIngredients.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold">
              排除：{preferences.excludedIngredients.join('、')}
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Preferences Configuration Panel (FR-02) */}
      {showPreferencesPanel && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">設定烹飪硬性限制</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI 推薦食譜將 100% 遵守下列硬性設備與飲食條件，絕不要求未選取設備。
              </p>
            </div>
            <button
              onClick={selectAllDevices}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              全選設備
            </button>
          </div>

          {/* 1. Cooking Devices */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              可用烹飪設備 (可複選) <span className="text-red-500">*硬性限制</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_DEVICES.map((dev) => {
                const isSelected = preferences.availableDevices.includes(dev);
                return (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => toggleDevice(dev)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="text-xs">{dev}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dietary Style */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              飲食風格取向 <span className="text-red-500">*嚴格遵守</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DIETARY_STYLES.map((st) => {
                const isSelected = preferences.dietaryStyles.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleDietary(st.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold ring-1 ring-teal-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{st.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-normal">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Excluded Ingredients */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              排除不吃的食材 (絕對不推薦)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_EXCLUSIONS.map((item) => {
                const isExcluded = preferences.excludedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleExclusion(item)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isExcluded
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isExcluded ? `✕ 不吃${item}` : item}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="自訂排除食材（例如：香菇、芹菜）"
                value={customExclusionInput}
                onChange={(e) => setCustomExclusionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomExclusion()}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addCustomExclusion}
                className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900"
              >
                加入排除
              </button>
            </div>
          </div>

          {/* 4. Time Limit & Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">最長烹調時間上限</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_LIMITS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updatePreferences({ maxCookingMinutes: t.value })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-center transition-all ${
                      preferences.maxCookingMinutes === t.value
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">預設份數</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updatePreferences({ servings: num })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
                      preferences.servings === num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} 人份
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-spin">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">AI 正在計算最佳食譜...</h3>
          <p className="text-xs text-slate-500 font-medium">{generationStep}</p>
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && recipes.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-xl">還沒有生成料理食譜</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            系統會讀取目前已確認的冰箱食材（現有 {ingredients.length} 種），並依您設定的設備與時間條件，產出最省時不浪費的料理方案！
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {ingredients.length === 0 ? (
              <button
                onClick={onGoToScan}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                先去拍照盤點冰箱食材
              </button>
            ) : (
              <button
                onClick={handleGenerateRecipes}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" /> 立即生成今日食譜
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recipes Cards Grid */}
      {!isGenerating && recipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              今日推薦料理 ({recipes.length} 道)
            </h2>
            <button
              onClick={handleGenerateRecipes}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 重新生成整批
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recipes.map((recipe) => {
              const hasPreviousVersion = Boolean(previousRecipesHistory[recipe.id]);

              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-3.5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-lg text-slate-900 tracking-tight">
                          {recipe.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Time Pill */}
                      <div className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-black shrink-0 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{recipe.totalMinutes} 分</span>
                      </div>
                    </div>

                    {/* Constraint Validation Badges (PRD FR-02/03) */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        設備：{recipe.requiredDevices.join('、')}
                      </span>
                      {recipe.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {recipe.constraintValidation.explanation || '合規'}
                      </span>
                    </div>

                    {/* Ingredients Preview */}
                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-700 text-[11px]">使用食材：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-lg font-medium text-[11px] ${
                              ing.isFromInventory
                                ? 'bg-white border border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ing.name} {ing.amount} {ing.unit}
                            {ing.isFromInventory && ' (冰箱)'}
                          </span>
                        ))}
                        {recipe.extraIngredientsNeeded.map((ext, i) => (
                          <span
                            key={'ext-' + i}
                            className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px]"
                          >
                            +{ext.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nutrition Estimates (PRD mandated: 必須標示為估算值) */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-3">
                        <span>熱量: {recipe.estimatedNutrition.calories} kcal</span>
                        <span>蛋白質: {recipe.estimatedNutrition.protein}g</span>
                        <span>碳水: {recipe.estimatedNutrition.carbs}g</span>
                        <span>脂肪: {recipe.estimatedNutrition.fat}g</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        ({recipe.estimatedNutrition.label})
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Dynamic Tweak / Replace Button (FR-04) */}
                      <button
                        onClick={() => {
                          setTweakingRecipe(recipe);
                          setTweakPrompt('');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>換一道 / 微調</span>
                      </button>

                      {hasPreviousVersion && (
                        <button
                          onClick={() => handleUndoTweak(recipe.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                          title="復原為換菜前的食譜"
                        >
                          <RotateCcw className="w-3 h-3" /> 復原
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingRecipe(recipe)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        查看步驟
                      </button>

                      <button
                        onClick={() => {
                          startCooking(recipe);
                          setActiveCookingRecipe(recipe);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-300" />
                        <span>開始料理</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipe Steps Detail Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-95 duration-150">
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{viewingRecipe.name}</h3>
                <p className="text-xs text-slate-500">預計總時長 {viewingRecipe.totalMinutes} 分鐘</p>
              </div>
              <button
                onClick={() => setViewingRecipe(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Substitutes */}
              {viewingRecipe.substitutes && viewingRecipe.substitutes.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
                  <span className="font-bold text-amber-900 block mb-1">💡 食材替代方案：</span>
                  {viewingRecipe.substitutes.map((s, idx) => (
                    <p key={idx} className="text-amber-800">
                      • <strong>{s.original}</strong> 可替代為 <strong>{s.substitute}</strong> ({s.note})
                    </p>
                  ))}
                </div>
              )}

              {/* Steps list */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 text-sm block">料理步驟清單：</span>
                {viewingRecipe.steps.map((st) => (
                  <div key={st.stepNumber} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">
                        {st.stepNumber}. {st.title}
                      </span>
                      {st.durationMinutes && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-slate-600">
                          約 {st.durationMinutes} 分鐘
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{st.instruction}</p>
                    {st.tip && <p className="text-[11px] text-emerald-700 mt-1 font-medium">💡 {st.tip}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingRecipe(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                關閉
              </button>
              <button
                onClick={() => {
                  startCooking(viewingRecipe);
                  setActiveCookingRecipe(viewingRecipe);
                  setViewingRecipe(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                開始料理導引
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Tweak / Replace Modal (FR-04) */}
      {tweakingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-95 duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">對話換菜與微調 (FR-04)</h3>
                <p className="text-xs text-slate-500">
                  針對「{tweakingRecipe.name}」提出需求，系統將保留原硬性條件為您重新推薦。
                </p>
              </div>
              <button
                onClick={() => setTweakingRecipe(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-2">快速選擇微調方向：</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '換一道不用開火的',
                  '這道我不喜歡，換另一道風味',
                  '改成微波爐可以做的',
                  '保留雞蛋與豆腐，其他換掉',
                  '時間再縮短一點 (10分鐘內)',
                  '蔬菜比例再提高一點',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setTweakPrompt(chip);
                      handleExecuteTweak(chip);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">自訂微調要求：</label>
              <textarea
                rows={3}
                placeholder="例如：不要高麗菜，改用洋蔥；或者改成冷拌涼菜做法..."
                value={tweakPrompt}
                onChange={(e) => setTweakPrompt(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTweakingRecipe(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isTweaking || !tweakPrompt.trim()}
                onClick={() => handleExecuteTweak()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all"
              >
                {isTweaking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 調整中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>送出微調要求</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Cooking Modal (FR-05) */}
      {activeCookingRecipe && (
        <CookingModal
          recipe={activeCookingRecipe}
          onClose={() => setActiveCookingRecipe(null)}
        />
      )}
    </div>
  );
};
