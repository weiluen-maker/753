import React from 'react';
import {
  Refrigerator,
  Camera,
  UtensilsCrossed,
  Sliders,
  History,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export type NavTab = 'inventory' | 'scan' | 'recipes' | 'preferences';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenHistory: () => void;
  serverStatus: { hasApiKey: boolean; isHealthy: boolean };
  totalIngredientsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenHistory,
  serverStatus,
  totalIngredientsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Refrigerator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">冰箱 AI</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">個人化食材與料理助手</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Refrigerator className="w-4 h-4" />
              <span>食材庫存</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                {totalIngredientsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'scan'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>拍照盤點</span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>料理推薦</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>條件設定</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHistory}
              title="查看庫存異動紀錄"
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">異動紀錄</span>
            </button>

            {/* Server Status Pill */}
            <div
              title={
                serverStatus.hasApiKey
                  ? 'Gemini 3.8 Flash 已連線就緒'
                  : '目前以展示模式運作（未設定 GEMINI_API_KEY）'
              }
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                serverStatus.hasApiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {serverStatus.hasApiKey ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Gemini AI 運作中</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>展示模式</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
              activeTab === 'inventory' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <Refrigerator className="w-5 h-5" />
              {totalIngredientsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {totalIngredientsCount > 9 ? '9+' : totalIngredientsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1">食材庫存</span>
          </button>

          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
              activeTab === 'scan' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[11px] mt-1">拍照盤點</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
              activeTab === 'recipes' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[11px] mt-1">料理推薦</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
              activeTab === 'preferences' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[11px] mt-1">設定</span>
          </button>
        </div>
      </div>
    </header>
  );
};
