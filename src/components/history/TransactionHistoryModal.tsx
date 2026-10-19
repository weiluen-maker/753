import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryTransaction, TransactionReason } from '../../types';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REASON_LABELS: Record<TransactionReason, { label: string; color: string }> = {
  photo_recognize: { label: '照片盤點匯入', color: 'bg-emerald-100 text-emerald-800' },
  cooking_deduct: { label: '料理完成扣除', color: 'bg-amber-100 text-amber-800' },
  manual_add: { label: '手動新增', color: 'bg-blue-100 text-blue-800' },
  manual_edit: { label: '手動修改', color: 'bg-purple-100 text-purple-800' },
  revert: { label: '撤銷復原', color: 'bg-slate-200 text-slate-800' },
};

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transactions, revertTransaction } = useApp();
  const [filterReason, setFilterReason] = useState<'全部' | TransactionReason>('全部');

  if (!isOpen) return null;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterReason !== '全部' && tx.reason !== filterReason) return false;
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getMonth() + 1}/${d.getDate()} ${d
        .getHours()
        .toString()
        .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-95 duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">庫存異動紀錄與更正</h3>
              <p className="text-[11px] text-slate-500">
                依 PRD 規範：異動紀錄永久保留，支援誤扣操作快速撤銷復原
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-500 font-medium">篩選：</span>
          {(['全部', 'cooking_deduct', 'photo_recognize', 'manual_add', 'revert'] as const).map(
            (reason) => (
              <button
                key={reason}
                onClick={() => setFilterReason(reason as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterReason === reason
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reason === '全部' ? '全部' : REASON_LABELS[reason]?.label || reason}
              </button>
            )
          )}
        </div>

        {/* Transactions List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>尚無任何庫存異動紀錄</span>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const reasonMeta = REASON_LABELS[tx.reason] || {
                label: tx.reason,
                color: 'bg-slate-100 text-slate-700',
              };
              const isNegative = tx.quantityDelta < 0;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${reasonMeta.color}`}>
                        {reasonMeta.label}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {tx.ingredientName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{tx.description}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div
                      className={`text-sm font-black flex items-center gap-1 ${
                        isNegative ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {isNegative ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      <span>
                        {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta} {tx.unit}
                      </span>
                    </div>

                    {/* Undo / Revert Button */}
                    {tx.reason !== 'revert' && (
                      <button
                        onClick={() => revertTransaction(tx.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                        title="撤銷本筆異動並還原庫存"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>撤銷更正</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
