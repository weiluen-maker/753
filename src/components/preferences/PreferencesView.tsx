import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info,
  Server,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CookingDevice, DietaryStyle } from '../../types';

interface PreferencesViewProps {
  onOpenHistory: () => void;
  serverStatus: { hasApiKey: boolean; isHealthy: boolean };
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

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  onOpenHistory,
  serverStatus,
}) => {
  const {
    preferences,
    updatePreferences,
    resetPantryToDefault,
    clearPantry,
    ingredients,
    transactions,
    showToast,
  } = useApp();

  const [confirmReset, setConfirmReset] = useState(false);

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

  const toggleDietary = (style: DietaryStyle) => {
    let current = [...preferences.dietaryStyles];
    if (current.includes(style)) {
      current = current.filter((s) => s !== style);
      if (current.length === 0) current = ['一般均衡'];
    } else {
      if (style === '全素') {
        current = ['全素'];
      } else {
        current = current.filter((s) => s !== '全素');
        current.push(style);
      }
    }
    updatePreferences({ dietaryStyles: current });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>個人化料理與系統設定</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">偏好設定與資料管理</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          設定您的常態廚房設備、飲食限制與料理偏好，AI 食譜將嚴格以最新條件運算。
        </p>
      </div>

      {/* AI Connection Status */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              serverStatus.hasApiKey
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Gemini 3.8 Flash 模型狀態</h4>
            <p className="text-xs text-slate-500">
              {serverStatus.hasApiKey
                ? '已載入伺服端 API 密鑰，支援即時多模態照片辨識與對話換菜'
                : '以展示模擬模式運作（已注入擬真食材與合規食譜庫）'}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            serverStatus.hasApiKey
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {serverStatus.hasApiKey ? '連線就緒' : '展示模式'}
        </span>
      </div>

      {/* Appliances Configuration */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-extrabold text-base text-slate-900">家中常備廚房設備</h3>
        <p className="text-xs text-slate-500">
          食譜必須能在選定設備條件下完成。設備不足時，不得假設使用者有未選取的工具。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {ALL_DEVICES.map((dev) => {
            const isSelected = preferences.availableDevices.includes(dev);
            return (
              <button
                key={dev}
                onClick={() => toggleDevice(dev)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs">{dev}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary Styles */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-extrabold text-base text-slate-900">飲食風格限制</h3>
        <p className="text-xs text-slate-500">
          全素模式不得推薦蛋、奶、肉、魚；生酮與低醣模式嚴格區分。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {DIETARY_STYLES.map((st) => {
            const isSelected = preferences.dietaryStyles.includes(st.id);
            return (
              <button
                key={st.id}
                onClick={() => toggleDietary(st.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{st.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{st.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Management & Resets */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">資料庫與異動管理</h3>
        <p className="text-xs text-slate-500">
          目前儲存 {ingredients.length} 種食材、{transactions.length} 筆庫存歷史異動。
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onOpenHistory}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            檢視庫存異動紀錄與撤銷
          </button>

          <button
            onClick={resetPantryToDefault}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 還原範例新鮮食材庫存
          </button>

          {confirmReset ? (
            <button
              onClick={() => {
                clearPantry();
                setConfirmReset(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
            >
              確定清空所有食材？
            </button>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> 清空食材庫存
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
