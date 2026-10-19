import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Recipe, RecipeStep } from '../../types';
import { useApp } from '../../context/AppContext';

interface CookingModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingModal: React.FC<CookingModalProps> = ({ recipe, onClose }) => {
  const {
    activeCookingSession,
    ingredients,
    finishCookingAndDeduct,
    cancelCooking,
    showToast,
  } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step Timer
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Completion & Deduction confirmation dialog
  const [showDeductionConfirm, setShowDeductionConfirm] = useState(false);
  const [deductionUsages, setDeductionUsages] = useState<
    Array<{
      ingredientId?: string;
      name: string;
      deductionAmount: number;
      unit: string;
      used: boolean;
      currentStock: number;
    }>
  >([]);

  const [deductionError, setDeductionError] = useState<string | null>(null);
  const [isDeducting, setIsDeducting] = useState(false);

  // Initialize deduction usages when opening confirmation
  useEffect(() => {
    const usages = recipe.ingredients.map((ing) => {
      const match = ingredients.find(
        (i) => (ing.inventoryIngredientId && i.id === ing.inventoryIngredientId) || i.name === ing.name
      );
      return {
        ingredientId: match?.id,
        name: ing.name,
        deductionAmount: ing.inventoryDeductionAmount,
        unit: ing.unit,
        used: true,
        currentStock: match ? match.quantity : 0,
      };
    });
    setDeductionUsages(usages);
  }, [recipe, ingredients]);

  // Step Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeTimerSeconds !== null && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (activeTimerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showToast('⏰ 計時器時間到！', 'success');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerSeconds]);

  const startStepTimer = (minutes: number) => {
    setActiveTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const toggleStepCompleted = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Adjust actual usage for deduction
  const updateUsageAmount = (index: number, newAmount: number) => {
    setDeductionUsages((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, deductionAmount: Math.max(0, newAmount) } : item))
    );
    setDeductionError(null);
  };

  const toggleUsageUsed = (index: number) => {
    setDeductionUsages((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, used: !item.used } : item))
    );
    setDeductionError(null);
  };

  // Handle final finish and deduct (FR-05)
  const handleConfirmFinishCooking = () => {
    if (!activeCookingSession) {
      showToast('找不到烹飪工作階段', 'error');
      return;
    }

    setIsDeducting(true);
    setDeductionError(null);

    // Validate no negative stock
    for (const item of deductionUsages) {
      if (item.used && item.deductionAmount > item.currentStock) {
        setDeductionError(
          `「${item.name}」扣除量 (${item.deductionAmount} ${item.unit}) 超過現有庫存 (${item.currentStock} ${item.unit})，請先調整實際用量！`
        );
        setIsDeducting(false);
        return;
      }
    }

    const result = finishCookingAndDeduct(activeCookingSession.id, deductionUsages);
    setIsDeducting(false);

    if (result.success) {
      onClose();
    } else {
      setDeductionError(result.error || '扣除庫存失敗');
    }
  };

  const currentStep = recipe.steps[currentStepIndex] || recipe.steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span>烹飪引導模式 (FR-05)</span>
            </div>
            <h2 className="text-xl font-black">{recipe.name}</h2>
          </div>

          <button
            onClick={() => {
              cancelCooking();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="退出烹飪"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-700">
                <Clock className="w-4 h-4 text-emerald-600" /> 總計 {recipe.totalMinutes} 分鐘
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-700">設備：{recipe.requiredDevices.join('、')}</span>
            </div>

            <div className="text-emerald-700 font-bold">
              步驟完成度：{completedSteps.length} / {recipe.steps.length}
            </div>
          </div>

          {/* Active Step Showcase */}
          <div className="bg-emerald-50/60 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs">
                第 {currentStepIndex + 1} 步 / 共 {recipe.steps.length} 步
              </span>

              {/* Checkbox button */}
              <button
                onClick={() => toggleStepCompleted(currentStep.stepNumber)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  completedSteps.includes(currentStep.stepNumber)
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedSteps.includes(currentStep.stepNumber) ? '已標記完成' : '標記此步已完成'}
                </span>
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{currentStep.title}</h3>
              <p className="text-slate-700 text-sm sm:text-base mt-2 leading-relaxed font-medium">
                {currentStep.instruction}
              </p>

              {currentStep.tip && (
                <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>主廚秘訣：</strong>
                    {currentStep.tip}
                  </span>
                </div>
              )}
            </div>

            {/* Step Timer if duration specified */}
            {currentStep.durationMinutes && (
              <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">本步驟建議計時：</span>
                  <span className="text-lg font-black font-mono text-emerald-800">
                    {activeTimerSeconds !== null
                      ? formatTimer(activeTimerSeconds)
                      : `${currentStep.durationMinutes}:00`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeTimerSeconds === null ? (
                    <button
                      onClick={() => startStepTimer(currentStep.durationMinutes!)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> 開始計時 ({currentStep.durationMinutes}分)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsTimerRunning((prev) => !prev)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all ${
                          isTimerRunning
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> 暫停
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> 繼續
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsTimerRunning(false);
                          setActiveTimerSeconds(null);
                        }}
                        className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600"
                        title="重設計時"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step Thumbnails / Quick Jump */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600">所有步驟導覽：</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.steps.map((st, idx) => (
                <button
                  key={st.stepNumber}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    setActiveTimerSeconds(null);
                    setIsTimerRunning(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    currentStepIndex === idx
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-300'
                      : completedSteps.includes(st.stepNumber)
                      ? 'border-slate-200 bg-slate-50 text-slate-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      completedSteps.includes(st.stepNumber)
                        ? 'bg-emerald-600 text-white'
                        : currentStepIndex === idx
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {completedSteps.includes(st.stepNumber) ? '✓' : st.stepNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{st.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{st.instruction}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => {
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                setActiveTimerSeconds(null);
                setIsTimerRunning(false);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              上一步
            </button>
            <button
              disabled={currentStepIndex === recipe.steps.length - 1}
              onClick={() => {
                setCurrentStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1));
                setActiveTimerSeconds(null);
                setIsTimerRunning(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40 transition-colors"
            >
              下一步
            </button>
          </div>

          {/* Finish Cooking Button */}
          <button
            onClick={() => setShowDeductionConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>完成料理並扣庫存</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Safe Deduction Modal (FR-05) */}
      {showDeductionConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in zoom-in-95 duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">確認食材使用量與庫存扣除</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  依 PRD 規範：請確認實際使用數量，確認後系統將自動扣除並記入異動歷史。
                </p>
              </div>
              <button
                onClick={() => setShowDeductionConfirm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deductionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deductionError}</span>
              </div>
            )}

            {/* Deduction Checklist */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {deductionUsages.map((item, idx) => {
                const remaining = Math.round((item.currentStock - item.deductionAmount) * 10) / 10;
                const isOverStock = item.used && item.deductionAmount > item.currentStock;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      !item.used
                        ? 'opacity-50 bg-slate-50 border-slate-200'
                        : isOverStock
                        ? 'bg-red-50/70 border-red-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.used}
                          onChange={() => toggleUsageUsed(idx)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-extrabold text-sm text-slate-900">{item.name}</span>
                      </label>

                      <span className="text-xs text-slate-500">
                        目前庫存：
                        <strong className="text-slate-800">
                          {item.currentStock} {item.unit}
                        </strong>
                      </span>
                    </div>

                    {item.used && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">實際用量：</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.deductionAmount}
                            onChange={(e) =>
                              updateUsageAmount(idx, parseFloat(e.target.value) || 0)
                            }
                            className={`w-20 px-2 py-1 text-center font-bold border rounded-lg focus:ring-2 ${
                              isOverStock
                                ? 'border-red-400 text-red-700 focus:ring-red-500'
                                : 'border-slate-300 focus:ring-emerald-500'
                            }`}
                          />
                          <span className="text-slate-600 font-bold">{item.unit}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500">扣除後剩餘：</span>
                          <span
                            className={`font-black ${
                              isOverStock ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {isOverStock ? '庫存不足！' : `${remaining} ${item.unit}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeductionConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                返回步驟
              </button>
              <button
                type="button"
                disabled={isDeducting}
                onClick={handleConfirmFinishCooking}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>確認扣除庫存並完成</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
