import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, NavTab } from './components/Navbar';
import { InventoryView } from './components/inventory/InventoryView';
import { ScanView } from './components/scan/ScanView';
import { RecipeGeneratorView } from './components/recipes/RecipeGeneratorView';
import { PreferencesView } from './components/preferences/PreferencesView';
import { TransactionHistoryModal } from './components/history/TransactionHistoryModal';
import { checkServerHealth } from './services/api';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function AppContent() {
  const { ingredients, toast } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('inventory');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState({
    hasApiKey: false,
    isHealthy: true,
  });

  useEffect(() => {
    checkServerHealth()
      .then((res) => {
        setServerStatus({
          hasApiKey: res.hasApiKey,
          isHealthy: res.status === 'ok',
        });
      })
      .catch(() => {
        setServerStatus({
          hasApiKey: false,
          isHealthy: false,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header & Mobile Bottom Nav */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        serverStatus={serverStatus}
        totalIngredientsCount={ingredients.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'inventory' && (
          <InventoryView
            onGoToScan={() => setActiveTab('scan')}
            onGoToRecipes={() => setActiveTab('recipes')}
          />
        )}

        {activeTab === 'scan' && (
          <ScanView onScanCompleted={() => setActiveTab('inventory')} />
        )}

        {activeTab === 'recipes' && (
          <RecipeGeneratorView onGoToScan={() => setActiveTab('scan')} />
        )}

        {activeTab === 'preferences' && (
          <PreferencesView
            onOpenHistory={() => setIsHistoryOpen(true)}
            serverStatus={serverStatus}
          />
        )}
      </main>

      {/* History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
