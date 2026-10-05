'use client';

import React from 'react';
import { CalculationResult, CurrencyCode, ShopCustomRule } from '@/types/calculator';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Save,
  Printer,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ProfitHeroCardProps {
  result: CalculationResult;
  listingCurrency: CurrencyCode;
  costCurrency: CurrencyCode;
  onSave: () => void;
  onPrint: () => void;
  isSaving: boolean;
  rules?: ShopCustomRule;
}

export const ProfitHeroCard: React.FC<ProfitHeroCardProps> = ({
  result,
  listingCurrency,
  costCurrency,
  onSave,
  onPrint,
  isSaving,
  rules,
}) => {
  const listingInfo = SUPPORTED_CURRENCIES[listingCurrency] || SUPPORTED_CURRENCIES.USD;
  const costInfo = SUPPORTED_CURRENCIES[costCurrency] || SUPPORTED_CURRENCIES.USD;

  const isProfitable = result.netProfitListingCurr > 0;
  const isLoss = result.netProfitListingCurr < 0;

  // Custom rule violation checks
  const breaksMinMargin = rules && result.profitMarginPercent < rules.minProfitMargin;

  // Proportions for visual progress bar
  const gross = result.grossRevenueListingCurr || 1;
  const profitPct = Math.max(0, (result.netProfitListingCurr / gross) * 100);
  const costPct = Math.max(0, (result.totalCostsListingCurr / gross) * 100);
  const feePct = Math.max(0, (result.fees.totalEtsyFeesListingCurr / gross) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner & Health Status Badge */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Net Profit & Take-Home Earnings
          </span>

          {/* Health Badge */}
          {result.healthStatus === 'exceptional' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>High Profit Margin ({result.profitMarginPercent.toFixed(1)}%)</span>
            </span>
          )}
          {result.healthStatus === 'healthy' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Healthy Margin ({result.profitMarginPercent.toFixed(1)}%)</span>
            </span>
          )}
          {result.healthStatus === 'moderate' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Fair Margin ({result.profitMarginPercent.toFixed(1)}%)</span>
            </span>
          )}
          {result.healthStatus === 'low' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
              <span>Low Margin ({result.profitMarginPercent.toFixed(1)}%)</span>
            </span>
          )}
          {result.healthStatus === 'loss' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Selling at a Loss!</span>
            </span>
          )}
        </div>

        {/* Hero Numbers */}
        <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-5 border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">Your Take-Home Profit</span>
              <div className="flex items-baseline space-x-2">
                <span
                  className={`text-4xl sm:text-5xl font-black tracking-tight ${
                    isLoss
                      ? 'text-rose-600'
                      : isProfitable
                      ? 'text-emerald-600'
                      : 'text-slate-800'
                  }`}
                >
                  {result.netProfitListingCurr >= 0 ? '+' : '-'}
                  {listingInfo.symbol}
                  {Math.abs(result.netProfitListingCurr).toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {listingInfo.code}
                </span>
              </div>
            </div>

            {/* Local Currency Dual Display */}
            {costCurrency !== listingCurrency && (
              <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-xs font-medium text-slate-500 block">
                  In Your Local Bank Account:
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  {result.netProfitLocalCurr >= 0 ? '+' : '-'}
                  {costInfo.symbol}
                  {Math.abs(result.netProfitLocalCurr).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="text-xs font-semibold text-slate-400 ml-1">
                  {costInfo.code}
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/60 text-center">
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Margin</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800">
                {result.profitMarginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Markup</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800">
                {result.markupPercent.toFixed(0)}%
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Break-Even</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800">
                {listingInfo.symbol}
                {result.breakEvenPriceListingCurr.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual 100% Revenue Distribution Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Where Every Dollar Goes:</span>
            <span>Order Total: {listingInfo.symbol}{result.grossRevenueListingCurr.toFixed(2)}</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {/* Profit */}
            <div
              style={{ width: `${Math.min(100, Math.max(0, profitPct))}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Profit: ${profitPct.toFixed(1)}%`}
            />
            {/* Costs */}
            <div
              style={{ width: `${Math.min(100, Math.max(0, costPct))}%` }}
              className="bg-slate-400 h-full transition-all duration-300"
              title={`Costs: ${costPct.toFixed(1)}%`}
            />
            {/* Etsy Fees */}
            <div
              style={{ width: `${Math.min(100, Math.max(0, feePct))}%` }}
              className="bg-orange-500 h-full transition-all duration-300"
              title={`Etsy Fees: ${feePct.toFixed(1)}%`}
            />
          </div>

          {/* Bar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Profit ({profitPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span>Costs ({costPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              <span>Etsy ({feePct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Rule Warnings (if any) */}
        {breaksMinMargin && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Shop Rule Alert: Profit margin is below your target of {rules?.minProfitMargin}%!</span>
            </p>
          </div>
        )}

        {/* Plain English Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1 mb-6">
            {result.recommendations.map((rec, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <span className="text-orange-600 font-bold shrink-0">•</span>
                <span>{rec}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer: Save & Print */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Listing'}</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition"
          title="Print or export invoice slip"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Invoice Slip</span>
        </button>
      </div>
    </div>
  );
};
