import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Camera,
  UtensilsCrossed,
  Filter,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Ingredient, IngredientCategory, StorageLocation } from '../../types';
import { AddIngredientModal } from './AddIngredientModal';

interface InventoryViewProps {
  onGoToScan: () => void;
  onGoToRecipes: () => void;
}

const CATEGORIES: Array<{ label: string; value: '全部' | IngredientCategory }> = [
  { label: '全部食材', value: '全部' },
  { label: '🥬 蔬菜', value: '蔬菜' },
  { label: '🥩 肉品', value: '肉品' },
  { label: '🐟 海鮮', value: '海鮮' },
  { label: '🥚 蛋豆製品', value: '蛋豆製品' },
  { label: '🥛 乳製品', value: '乳製品' },
  { label: '🧂 醬料調味', value: '醬料調味' },
  { label: '🍎 水果', value: '水果' },
  { label: '🍚 主食', value: '主食' },
  { label: '📦 其他', value: '其他' },
];

const LOCATIONS: Array<{ label: string; value: '全部' | StorageLocation }> = [
  { label: '全部位置', value: '全部' },
  { label: '❄️ 冷藏', value: '冷藏' },
  { label: '🧊 冷凍', value: '冷凍' },
  { label: '🧺 常溫', value: '常溫' },
];

export const InventoryView: React.FC<InventoryViewProps> = ({ onGoToScan, onGoToRecipes }) => {
  const {
    ingredients,
    adjustIngredientQuantity,
    deleteIngredient,
    addOrUpdateIngredient,
    resetPantryToDefault,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'全部' | IngredientCategory>('全部');
  const [selectedLocation, setSelectedLocation] = useState<'全部' | StorageLocation>('全部');
  const [onlyExpiring, setOnlyExpiring] = useState(false);

  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to calculate days until expiry
  const getDaysUntilExpiry = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      // Search
      if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        return false;
      }
      // Category
      if (selectedCategory !== '全部' && item.category !== selectedCategory) {
        return false;
      }
      // Location
      if (selectedLocation !== '全部' && item.storageLocation !== selectedLocation) {
        return false;
      }
      // Expiring soon (within 3 days)
      if (onlyExpiring) {
        const days = getDaysUntilExpiry(item.expiryDate);
        if (days === null || days > 3) return false;
      }
      return true;
    });
  }, [ingredients, searchQuery, selectedCategory, selectedLocation, onlyExpiring]);

  // Statistics
  const expiringCount = useMemo(() => {
    return ingredients.filter((item) => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days !== null && days <= 3;
    }).length;
  }, [ingredients]);

  const coldCount = useMemo(() => {
    return ingredients.filter((i) => i.storageLocation === '冷藏').length;
  }, [ingredients]);

  const frozenCount = useMemo(() => {
    return ingredients.filter((i) => i.storageLocation === '冷凍').length;
  }, [ingredients]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>智慧食材庫存中心</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              現有食材 <span className="text-emerald-200">{ingredients.length}</span> 種
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-lg">
              拍照辨識即時盤點、智能追蹤保存天數，一鍵將剩餘食材轉為免動腦美味料理！
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onGoToScan}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>拍照盤點冰箱</span>
            </button>
            <button
              onClick={onGoToRecipes}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white rounded-xl font-bold text-sm border border-emerald-400/30 transition-all active:scale-95"
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-300" />
              <span>智能推薦料理</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative circle */}
        <div className="absolute -right-8 -bottom-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Stat Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">總品項數量</p>
            <p className="text-xl font-black text-slate-800">{ingredients.length} 項</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <button
          onClick={() => setOnlyExpiring((prev) => !prev)}
          className={`p-3.5 rounded-2xl border shadow-xs text-left transition-all ${
            onlyExpiring
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-[11px] font-semibold ${
                  onlyExpiring ? 'text-amber-100' : 'text-amber-800'
                }`}
              >
                即期食材 (≤3天)
              </p>
              <p
                className={`text-xl font-black ${
                  onlyExpiring ? 'text-white' : 'text-amber-600'
                }`}
              >
                {expiringCount} 項
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                onlyExpiring ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </button>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">冷藏保鮮</p>
            <p className="text-xl font-black text-sky-700">{coldCount} 項</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
            ❄️
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">冷凍常備</p>
            <p className="text-xl font-black text-indigo-700">{frozenCount} 項</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            🧊
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Location Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋食材名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Location Buttons */}
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                onClick={() => setSelectedLocation(loc.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  selectedLocation === loc.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Add Manual Item Button */}
          <button
            onClick={() => {
              setEditingIngredient(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新增食材</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.value
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients List / Cards */}
      {filteredIngredients.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">沒有找到符合的食材</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            您尚未加入此類別食材，或搜尋關鍵字無匹配項目。
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('全部');
                setSelectedLocation('全部');
                setOnlyExpiring(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              清除所有篩選條件
            </button>
            <button
              onClick={resetPantryToDefault}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 還原範例食材庫存
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredIngredients.map((item) => {
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
            const isExpired = daysLeft !== null && daysLeft < 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isExpired
                    ? 'border-red-300 bg-red-50/20'
                    : isExpiringSoon
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                          {item.storageLocation}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.notes}</p>
                      )}
                    </div>

                    {/* Expiry Pill */}
                    {daysLeft !== null && (
                      <div
                        className={`text-[10px] font-black px-2 py-0.8 rounded-lg shrink-0 flex items-center gap-1 ${
                          isExpired
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isExpiringSoon
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isExpired
                          ? '已過期'
                          : daysLeft === 0
                          ? '今日到期'
                          : `剩 ${daysLeft} 天`}
                      </div>
                    )}
                  </div>

                  {item.isEstimatedQuantity && (
                    <div className="mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 數量為照片辨識估算值
                    </div>
                  )}
                </div>

                {/* Bottom Row: Quantity Stepper and Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Stepper */}
                  <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                    <button
                      onClick={() => adjustIngredientQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-sm active:scale-95 transition-transform"
                      title="減少 1"
                    >
                      -
                    </button>
                    <div className="text-center min-w-[50px]">
                      <span className="font-extrabold text-sm text-slate-800">
                        {item.quantity}
                      </span>{' '}
                      <span className="text-[11px] text-slate-500 font-medium">{item.unit}</span>
                    </div>
                    <button
                      onClick={() => adjustIngredientQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-sm active:scale-95 transition-transform"
                      title="增加 1"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingIngredient(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="編輯食材"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteIngredient(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating or Bottom Quick Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-900 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            目前庫存可供 AI 直接扣除與生成食譜。若食材用完或有新採買，可隨時拍照盤點！
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={resetPantryToDefault}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            重設範例庫存
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addOrUpdateIngredient}
        initialData={editingIngredient}
      />
    </div>
  );
};
