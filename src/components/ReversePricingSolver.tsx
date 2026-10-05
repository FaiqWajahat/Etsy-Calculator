'use client';

import React, { useState } from 'react';
import { CalculatorInputs, CurrencyCode } from '@/types/calculator';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import { calculateReversePrice } from '@/lib/calculator';
import { Target, ArrowRight, Sparkles, Check, DollarSign, Percent } from 'lucide-react';

interface ReversePricingSolverProps {
  inputs: CalculatorInputs;
  rates: Record<string, number>;
  onApplyPrice: (price: number) => void;
}

export const ReversePricingSolver: React.FC<ReversePricingSolverProps> = ({
  inputs,
  rates,
  onApplyPrice,
}) => {
  const [targetType, setTargetType] = useState<'profit' | 'margin'>('profit');
  const [targetValue, setTargetValue] = useState<number>(15);

  const listingInfo = SUPPORTED_CURRENCIES[inputs.listingCurrency] || SUPPORTED_CURRENCIES.USD;
  const costInfo = SUPPORTED_CURRENCIES[inputs.costCurrency] || SUPPORTED_CURRENCIES.USD;

  // Calculate required price
  const requiredPrice = calculateReversePrice(
    { type: targetType, value: targetValue },
    inputs,
    rates
  );

  // Calculate with Free Shipping option (where shipping charged = 0)
  const freeShippingPrice = calculateReversePrice(
    { type: targetType, value: targetValue },
    { ...inputs, shippingChargedToCustomer: 0 },
    rates
  );

  // Price with 20% discount buffer
  const discountBufferPrice = calculateReversePrice(
    { type: targetType, value: targetValue },
    { ...inputs, discountPercent: 20 },
    rates
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Reverse Target Pricing Solver
          </h2>
          <p className="text-xs text-slate-500">
            Tell us how much profit you want, and we will calculate the exact Etsy price to charge!
          </p>
        </div>
      </div>

      {/* Target Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setTargetType('profit');
              setTargetValue(15);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              targetType === 'profit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Target Dollar Profit ({listingInfo.symbol})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetType('margin');
              setTargetValue(40);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              targetType === 'margin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Target Profit Margin (%)</span>
          </button>
        </div>

        {/* Input / Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {targetType === 'profit' ? (
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-slate-400">
                {listingInfo.symbol}
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                className="w-32 pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-3 w-full sm:w-60">
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 10)}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <span className="text-lg font-bold text-slate-900 min-w-14">
                {targetValue}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Solution Box */}
      <div className="bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-slate-50 border-2 border-orange-200 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 block mb-1">
              Recommended Etsy Retail Price
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {listingInfo.symbol}
                {requiredPrice.toFixed(2)}
              </span>
              <span className="text-base font-bold text-slate-500">
                {listingInfo.code}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 max-w-md">
              Listing at this price covers all Etsy listing, transaction, and payment processing fees,
              covers your item and shipping costs, and guarantees your{' '}
              <strong>
                {targetType === 'profit' ? `${listingInfo.symbol}${targetValue} profit` : `${targetValue}% margin`}
              </strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onApplyPrice(parseFloat(requiredPrice.toFixed(2)))}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-orange-600/20 transition self-start md:self-center"
          >
            <span>Apply to Calculator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Free Shipping Strategy */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Free Shipping Price Strategy
            </span>
            <span className="text-xs text-slate-500">
              Absorbs shipping inside item price for Etsy SEO boost
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-slate-900 block">
              {listingInfo.symbol}
              {freeShippingPrice.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => onApplyPrice(parseFloat(freeShippingPrice.toFixed(2)))}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
            >
              Use This Price
            </button>
          </div>
        </div>

        {/* 20% Sale Cushion Strategy */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              20% Sale Cushion Strategy
            </span>
            <span className="text-xs text-slate-500">
              Allows you to run a 20% off sale and still get target profit
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-slate-900 block">
              {listingInfo.symbol}
              {discountBufferPrice.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => onApplyPrice(parseFloat(discountBufferPrice.toFixed(2)))}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
            >
              Use This Price
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
