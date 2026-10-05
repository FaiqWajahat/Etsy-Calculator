'use client';

import React from 'react';
import { FileDown, Printer, Sparkles, Truck, RotateCcw } from 'lucide-react';
import { CalculatorInputs } from '@/types/calculator';

interface PresetsBarProps {
  currentType: string;
  onApplyPreset: (patch: Partial<CalculatorInputs>) => void;
  onReset: () => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({
  currentType,
  onApplyPreset,
  onReset,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs mb-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick 1-Click Presets:
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            (Picks smart defaults for your product type)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Digital Download */}
          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                listingType: 'digital',
                shippingChargedToCustomer: 0,
                shippingActualCost: 0,
                packagingCost: 0,
                laborHours: 0,
                laborRatePerHour: 0,
              })
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              currentType === 'digital'
                ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileDown className="w-3.5 h-3.5 text-purple-600" />
            <span>Digital Download</span>
          </button>

          {/* Print on Demand */}
          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                listingType: 'pod',
                packagingCost: 0,
                laborHours: 0,
              })
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              currentType === 'pod'
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print on Demand (POD)</span>
          </button>

          {/* Handmade Craft */}
          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                listingType: 'physical',
              })
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              currentType === 'physical'
                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Handmade Physical</span>
          </button>

          {/* Free Shipping Guarantee */}
          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                shippingChargedToCustomer: 0,
              })
            }
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Free Shipping Guarantee</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Reset to default numbers"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
