'use client';

import React, { useState, useEffect } from 'react';
import { ShopCustomRule } from '@/types/calculator';
import { DEFAULT_RULES } from '@/lib/constants';
import {
  SlidersHorizontal,
  X,
  Save,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Tag,
  DollarSign,
  RotateCcw,
} from 'lucide-react';

interface ShopRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ShopCustomRule;
  onSaveRules: (updated: ShopCustomRule) => void;
}

export const ShopRulesModal: React.FC<ShopRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
}) => {
  const [formData, setFormData] = useState<ShopCustomRule>({ ...rules });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        minProfitMargin: rules.minProfitMargin ?? 30,
        minProfitAmountUSD: rules.minProfitAmountUSD ?? 5.0,
        defaultPlatformFeePercent: rules.defaultPlatformFeePercent ?? 15,
        defaultDiscountPercent: rules.defaultDiscountPercent ?? 0,
      });
      setSavedSuccess(false);
    }
  }, [isOpen, rules]);

  if (!isOpen) return null;

  const handleResetToDefaults = () => {
    setFormData({ ...DEFAULT_RULES });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRules(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const MARGIN_PRESETS = [20, 25, 30, 35, 40, 50];
  const DISCOUNT_PRESETS = [0, 10, 15, 20, 25, 30, 40];
  const FEE_PRESETS = [12, 14, 15, 18, 20];
  const DOLLAR_PRESETS = [3, 5, 8, 10, 15];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Shop Rules &amp; Defaults
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure default margins, discount promos &amp; fees for your shop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* RULE 1: Default Target Profit Margin */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-bold text-slate-900">
                    Default Target Profit Margin (%)
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This margin is automatically pre-filled in the Pricing Studio. You can still adjust it per listing.
                </p>
              </div>

              {/* Number Input */}
              <div className="relative flex items-center shrink-0">
                <input
                  type="number"
                  min="5"
                  max="80"
                  step="1"
                  value={formData.minProfitMargin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minProfitMargin: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-18 pl-2.5 pr-6 py-1 bg-white border border-emerald-300 rounded-xl text-sm font-black text-emerald-900 text-left focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <span className="absolute right-2 text-xs font-bold text-emerald-700 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="10"
              max="70"
              step="1"
              value={formData.minProfitMargin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minProfitMargin: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-emerald-600 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {MARGIN_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData({ ...formData, minProfitMargin: m })}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    formData.minProfitMargin === m
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-emerald-200 text-slate-700 hover:bg-emerald-100/60'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* RULE 2: Default Promotional Discount (%) */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/90 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-bold text-slate-900">
                    Default Promotional Discount (%)
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Default sale discount for calculating strikethrough prices. Set to 0% for regular full price.
                </p>
              </div>

              {/* Number Input */}
              <div className="relative flex items-center shrink-0">
                <input
                  type="number"
                  min="0"
                  max="70"
                  step="1"
                  value={formData.defaultDiscountPercent ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultDiscountPercent: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-18 pl-2.5 pr-6 py-1 bg-white border border-amber-300 rounded-xl text-sm font-black text-amber-950 text-left focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                <span className="absolute right-2 text-xs font-bold text-amber-700 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={formData.defaultDiscountPercent ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultDiscountPercent: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-amber-600 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {DISCOUNT_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, defaultDiscountPercent: d })
                  }
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    (formData.defaultDiscountPercent ?? 0) === d
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/60'
                  }`}
                >
                  {d === 0 ? '0% (No Sale)' : `${d}%`}
                </button>
              ))}
            </div>
          </div>

          {/* RULE 3: Default Combined Platform Fee (Etsy + Payoneer) */}
          <div className="p-4 bg-orange-50/50 border border-orange-200/90 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <label className="text-xs font-bold text-slate-900">
                    Platform Fee Rule (Etsy + Payoneer)
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Standard is 15% (Etsy 6.5% transaction + payment processing + Payoneer buffer).
                </p>
              </div>

              {/* Number Input */}
              <div className="relative flex items-center shrink-0">
                <input
                  type="number"
                  min="5"
                  max="35"
                  step="1"
                  value={formData.defaultPlatformFeePercent ?? 15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultPlatformFeePercent: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-18 pl-2.5 pr-6 py-1 bg-white border border-orange-300 rounded-xl text-sm font-black text-orange-950 text-left focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
                />
                <span className="absolute right-2 text-xs font-bold text-orange-700 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="8"
              max="30"
              step="1"
              value={formData.defaultPlatformFeePercent ?? 15}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultPlatformFeePercent: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-orange-600 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {FEE_PRESETS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, defaultPlatformFeePercent: f })
                  }
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    (formData.defaultPlatformFeePercent ?? 15) === f
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/60'
                  }`}
                >
                  {f}%
                </button>
              ))}
            </div>
          </div>

          {/* RULE 4: Minimum Dollar Profit Guardrail */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>Minimum Net Profit per Item</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Warn if take-home profit drops below this flat dollar amount
                </p>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.minProfitAmountUSD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minProfitAmountUSD: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-20 pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-left focus:ring-1 focus:ring-orange-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Dollar presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {DOLLAR_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFormData({ ...formData, minProfitAmountUSD: d })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    formData.minProfitAmountUSD === d
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ${d}
                </button>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Reset all rules to standard recommended defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved &amp; Applied!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Apply Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
