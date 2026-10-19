import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { recognizeIngredientsFromImage } from '../../services/api';
import { sampleFridgePresets, PresetFridgeSample } from '../../data/defaultPantry';
import {
  IngredientCategory,
  RecognitionItem,
  StorageLocation,
} from '../../types';

interface ScanViewProps {
  onScanCompleted: () => void;
}

const CATEGORIES: IngredientCategory[] = [
  '蔬菜',
  '肉品',
  '海鮮',
  '蛋豆製品',
  '乳製品',
  '醬料調味',
  '水果',
  '主食',
  '其他',
];

const STORAGE_LOCATIONS: StorageLocation[] = ['冷藏', '冷凍', '常溫'];
const UNITS = ['顆', '盒', '條', '把', '包', '片', '瓶', '袋', '克', '塊', '份'];

export const ScanView: React.FC<ScanViewProps> = ({ onScanCompleted }) => {
  const { ingredients, confirmRecognizedItems, showToast } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [recognizedItems, setRecognizedItems] = useState<RecognitionItem[]>([]);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64 and start recognition
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('請上傳有效的照片格式 (JPG, PNG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setActivePresetId(null);
      startRecognition(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Load a demo sample fridge preset
  const handleSelectPreset = (preset: PresetFridgeSample) => {
    setImagePreview(preset.image);
    setActivePresetId(preset.id);
    startRecognition(preset.image, 'image/svg+xml');
  };

  const startRecognition = async (imageBase64: string, mimeType: string = 'image/jpeg') => {
    setIsScanning(true);
    setScanWarning(null);
    setRecognizedItems([]);
    setScanStepText('正在解析照片與光影輪廓...');

    try {
      setTimeout(() => {
        setScanStepText('Gemini 視覺模型辨識食材分類與數量...');
      }, 700);

      const result = await recognizeIngredientsFromImage(imageBase64, mimeType);

      if (result.warning) {
        setScanWarning(result.warning);
      }

      // Check duplicates with existing pantry
      const processed: RecognitionItem[] = (result.items || []).map((rawItem, idx) => {
        const existing = ingredients.find(
          (ing) => ing.name.trim().toLowerCase() === rawItem.name.trim().toLowerCase()
        );

        return {
          id: 'recog-' + Date.now() + '-' + idx,
          name: rawItem.name || '未命名食材',
          category: (rawItem.category as IngredientCategory) || '其他',
          quantity: typeof rawItem.quantity === 'number' ? rawItem.quantity : 1,
          unit: rawItem.unit || '份',
          confidence: typeof rawItem.confidence === 'number' ? rawItem.confidence : 0.85,
          isEstimatedQuantity: Boolean(rawItem.isEstimatedQuantity),
          storageLocation: (rawItem.storageLocation as StorageLocation) || '冷藏',
          suggestedExpiryDays: rawItem.suggestedExpiryDays || 7,
          notes: rawItem.notes || '',
          isConfirmed: true, // Default checked for inclusion
          isDuplicate: Boolean(existing),
          duplicateAction: existing ? 'merge' : 'add_new',
          existingIngredientId: existing?.id,
          boundingBox: rawItem.boundingBox,
        };
      });

      setRecognizedItems(processed);
      showToast(`辨識完成！偵測到 ${processed.length} 項食材，請確認後加入庫存`, 'success');
    } catch (err: any) {
      console.error(err);
      setScanWarning(`辨識過程發生問題：${err.message || '連線逾時'}`);
      showToast('辨識失敗，請檢查照片或重新嘗試', 'error');
    } finally {
      setIsScanning(false);
      setScanStepText('');
    }
  };

  // Inline edit handlers
  const updateItem = (id: string, updates: Partial<RecognitionItem>) => {
    setRecognizedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
    setRecognizedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addNewBlankItem = () => {
    const newItem: RecognitionItem = {
      id: 'recog-' + Date.now() + '-manual',
      name: '',
      category: '蔬菜',
      quantity: 1,
      unit: '顆',
      confidence: 1.0,
      isEstimatedQuantity: false,
      storageLocation: '冷藏',
      suggestedExpiryDays: 7,
      isConfirmed: true,
      duplicateAction: 'add_new',
    };
    setRecognizedItems((prev) => [newItem, ...prev]);
  };

  // Confirmation Flow (FR-01: 使用者未確認前不得覆寫庫存)
  const handleConfirmAll = () => {
    const confirmedList = recognizedItems.filter((i) => i.isConfirmed && i.name.trim());
    if (confirmedList.length === 0) {
      showToast('請至少勾選一項已確認食材', 'error');
      return;
    }

    confirmRecognizedItems(confirmedList);
    // Reset scan view
    setImagePreview(null);
    setRecognizedItems([]);
    onScanCompleted();
  };

  const handleCancel = () => {
    setImagePreview(null);
    setRecognizedItems([]);
    setScanWarning(null);
    showToast('已取消本次盤點，未變更任何庫存', 'info');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>FR-01 AI 視覺盤點</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              拍照盤點與智慧辨識
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              拍攝或上傳冰箱內部照片，AI 會自動偵測食材、提供覆核清單與數量確認，確保庫存準確不失真。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>現場拍照</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>從相簿上傳</span>
            </button>

            {/* Hidden HTML Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Preset Sample Fridge Buttons for Instant Experience */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>沒有冰箱照片？點擊下列情境範例立即體驗 AI 辨識：</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {sampleFridgePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePresetId === preset.id
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">{preset.title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {preset.sampleCount} 項食材
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warning / Notification Banner */}
      {scanWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">辨識提示通知</p>
            <p className="text-amber-800 leading-relaxed">{scanWarning}</p>
          </div>
        </div>
      )}

      {/* Main Scan Area */}
      {isScanning && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">AI 食材視覺分析中...</h3>
          <p className="text-xs text-slate-500 font-medium">{scanStepText}</p>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Photo Preview & Recognition Review */}
      {!isScanning && imagePreview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image with Bounding Boxes */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-xs overflow-hidden">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-[380px]">
                <img
                  src={imagePreview}
                  alt="冰箱照片"
                  className="w-full h-auto object-contain max-h-[380px]"
                />

                {/* Bounding Boxes Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                >
                  {recognizedItems.map((item) => {
                    if (!item.boundingBox) return null;
                    const { ymin, xmin, ymax, xmax } = item.boundingBox;
                    const isHovered = highlightedItemId === item.id;

                    return (
                      <g key={item.id}>
                        <rect
                          x={xmin}
                          y={ymin}
                          width={xmax - xmin}
                          height={ymax - ymin}
                          fill={isHovered ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)'}
                          stroke={isHovered ? '#059669' : '#10b981'}
                          strokeWidth={isHovered ? '6' : '3'}
                          strokeDasharray={item.confidence < 0.75 ? '8,4' : undefined}
                          rx="8"
                        />
                        <rect
                          x={xmin}
                          y={Math.max(0, ymin - 35)}
                          width={Math.max(120, item.name.length * 28 + 20)}
                          height="35"
                          fill="#065f46"
                          rx="4"
                        />
                        <text
                          x={xmin + 10}
                          y={Math.max(22, ymin - 12)}
                          fill="white"
                          fontSize="22"
                          fontWeight="bold"
                          fontFamily="system-ui, sans-serif"
                        >
                          {item.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-2.5 px-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  綠框代表 AI 辨識框，虛線代表低信心度需確認
                </span>
                <button
                  onClick={() => startRecognition(imagePreview)}
                  className="flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 重新辨識
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Structured Editable Table / Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    AI 食材覆核清單 ({recognizedItems.length} 項)
                  </h3>
                  <p className="text-xs text-slate-500">
                    依 PRD 規範：請確認名稱、數量與存放位置，確定無誤後再點擊加入庫存。
                  </p>
                </div>

                <button
                  onClick={addNewBlankItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 追加食材
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {recognizedItems.map((item) => {
                  const isLowConfidence = item.confidence < 0.75;

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHighlightedItemId(item.id)}
                      onMouseLeave={() => setHighlightedItemId(null)}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        !item.isConfirmed
                          ? 'opacity-50 bg-slate-50 border-slate-200'
                          : isLowConfidence
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={item.isConfirmed}
                          onChange={(e) => updateItem(item.id, { isConfirmed: e.target.checked })}
                          className="mt-2 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />

                        {/* Editable Form Controls */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={item.name}
                              placeholder="食材名稱"
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="px-2.5 py-1 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 w-36"
                            />

                            <select
                              value={item.category}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  category: e.target.value as IngredientCategory,
                                })
                              }
                              className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            <select
                              value={item.storageLocation}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  storageLocation: e.target.value as StorageLocation,
                                })
                              }
                              className="px-2 py-1 text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-800 rounded-lg"
                            >
                              {STORAGE_LOCATIONS.map((loc) => (
                                <option key={loc} value={loc}>
                                  {loc}
                                </option>
                              ))}
                            </select>

                            {/* Low confidence badge */}
                            {isLowConfidence && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                辨識信心度偏低 ({Math.round(item.confidence * 100)}%)
                              </span>
                            )}

                            {/* Estimated quantity tag */}
                            {item.isEstimatedQuantity && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                                待確認數量 (推測)
                              </span>
                            )}
                          </div>

                          {/* Quantity & Unit Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium">數量:</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: parseFloat(e.target.value) || 1,
                                  isEstimatedQuantity: false, // User confirmed manually
                                })
                              }
                              className="w-20 px-2 py-1 font-bold text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />

                            <select
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                              className="px-2 py-1 font-semibold border border-slate-200 rounded-lg bg-white"
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>

                            <span className="text-slate-400">|</span>

                            <span className="text-slate-500 font-medium">預估保存:</span>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              value={item.suggestedExpiryDays || 7}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  suggestedExpiryDays: parseInt(e.target.value) || 7,
                                })
                              }
                              className="w-14 px-1.5 py-1 text-center font-bold border border-slate-200 rounded-lg"
                            />
                            <span className="text-slate-500">天</span>
                          </div>

                          {/* Duplicate Detection Resolution */}
                          {item.isDuplicate && (
                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-blue-900">
                                💡 現有庫存已有此食材，請選擇處理方式：
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { duplicateAction: 'merge' })}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                    item.duplicateAction === 'merge'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white text-blue-700 border border-blue-300'
                                  }`}
                                >
                                  合併現有數量
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(item.id, { duplicateAction: 'add_new' })
                                  }
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                    item.duplicateAction === 'add_new'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white text-blue-700 border border-blue-300'
                                  }`}
                                >
                                  獨立新增一筆
                                </button>
                              </div>
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-[11px] text-slate-500 italic">備註：{item.notes}</p>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="捨棄誤判項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Confirmation Bar (FR-01) */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  已選中{' '}
                  <span className="font-bold text-emerald-700">
                    {recognizedItems.filter((i) => i.isConfirmed).length}
                  </span>{' '}
                  / {recognizedItems.length} 項食材
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleCancel}
                    className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                  >
                    取消盤點
                  </button>
                  <button
                    onClick={handleConfirmAll}
                    className="w-1/2 sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>確認加入庫存</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty Initial Screen Guide */}
      {!imagePreview && !isScanning && (
        <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">準備好盤點冰箱了嗎？</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            打開冰箱，平視各層食材拍照。系統會自動辨識包裝、蔬果、蛋奶與調味品，並為您標記儲存期限與建議數量！
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <Camera className="w-4 h-4" /> 啟動相機拍照
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Upload className="w-4 h-4 text-slate-500" /> 上傳照片檔案
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
