'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Truck,
  Globe,
  Weight,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ShippingRateCard } from '@/types/calculator';

const DEFAULT_COURIERS = [
  'DHL Express',
  'DHL Economy',
  'FedEx International Priority',
  'FedEx International Economy',
  'Skynet Worldwide Express',
  'Pakistan Post / EMS',
  'TCS Courier',
  'Leopards Courier',
  'M&P Express',
  'OCS Worldwide',
];

const ZONE_PRESETS: Record<string, string[]> = {
  'USA & Canada': ['United States', 'Canada'],
  'UK & Ireland': ['United Kingdom', 'Ireland'],
  'Europe': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden', 'Denmark', 'Norway', 'Finland', 'Austria', 'Switzerland', 'Poland', 'Portugal'],
  'Gulf / Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
  'Australia & NZ': ['Australia', 'New Zealand'],
  'South Asia': ['India', 'Bangladesh', 'Sri Lanka', 'Nepal'],
  'East Asia': ['China', 'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan'],
  'Rest of World': [],
};

const STANDARD_WEIGHTS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0];

const emptyCard = (): Omit<ShippingRateCard, 'id' | '_id' | 'createdAt' | 'updatedAt'> => ({
  courier: '',
  zoneLabel: '',
  countries: [],
  weightSlabs: STANDARD_WEIGHTS.slice(0, 6).map((w) => ({ weightKg: w, costPKR: 0 })),
  currency: 'PKR',
  fuelSurchargePercent: 0,
  notes: '',
  isActive: true,
});

interface ShippingManagerProps {
  exchangeRate?: number; // PKR per USD
  listingCurrency?: string;
  onRatesUpdated?: () => void;
}

export const ShippingManager: React.FC<ShippingManagerProps> = ({
  exchangeRate = 278,
  onRatesUpdated,
}) => {
  const [rates, setRates] = useState<ShippingRateCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCard());
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [zonePresetOpen, setZonePresetOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shipping-rates');
      const json = await res.json();
      if (json.success) {
        setRates(
          (json.data as ShippingRateCard[]).map((r) => ({
            ...r,
            id: r._id?.toString() || r.id,
          }))
        );
      }
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const openNewForm = () => {
    setForm(emptyCard());
    setEditingId(null);
    setIsFormOpen(true);
    setZonePresetOpen(false);
  };

  const openEditForm = (card: ShippingRateCard) => {
    setForm({
      courier: card.courier,
      zoneLabel: card.zoneLabel,
      countries: [...(card.countries || [])],
      weightSlabs: [...(card.weightSlabs || [])],
      currency: card.currency || 'PKR',
      fuelSurchargePercent: card.fuelSurchargePercent || 0,
      notes: card.notes || '',
      isActive: card.isActive !== false,
    });
    setEditingId(card.id || card._id || null);
    setIsFormOpen(true);
    setZonePresetOpen(false);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const applyZonePreset = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      zoneLabel: zone,
      countries: [...(ZONE_PRESETS[zone] || [])],
    }));
    setZonePresetOpen(false);
  };

  const updateSlab = (idx: number, field: 'weightKg' | 'costPKR', value: number) => {
    setForm((prev) => {
      const slabs = [...prev.weightSlabs];
      slabs[idx] = { ...slabs[idx], [field]: value };
      return { ...prev, weightSlabs: slabs };
    });
  };

  const removeSlab = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      weightSlabs: prev.weightSlabs.filter((_, i) => i !== idx),
    }));
  };

  const addCustomWeight = () => {
    const w = parseFloat(newWeightInput);
    if (isNaN(w) || w <= 0) return;
    const exists = form.weightSlabs.some((s) => s.weightKg === w);
    if (exists) return;
    setForm((prev) => ({
      ...prev,
      weightSlabs: [...prev.weightSlabs, { weightKg: w, costPKR: 0 }].sort(
        (a, b) => a.weightKg - b.weightKg
      ),
    }));
    setNewWeightInput('');
  };

  const addStandardWeights = () => {
    const existing = new Set(form.weightSlabs.map((s) => s.weightKg));
    const toAdd = STANDARD_WEIGHTS.filter((w) => !existing.has(w));
    setForm((prev) => ({
      ...prev,
      weightSlabs: [...prev.weightSlabs, ...toAdd.map((w) => ({ weightKg: w, costPKR: 0 }))].sort(
        (a, b) => a.weightKg - b.weightKg
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.courier.trim()) { showToast('Courier name required'); return; }
    if (!form.zoneLabel.trim()) { showToast('Zone / destination required'); return; }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/shipping-rates/${editingId}` : '/api/shipping-rates';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Rate card updated ✓' : 'Rate card saved ✓');
        await loadRates();
        onRatesUpdated?.();
        closeForm();
      } else {
        showToast('Save failed — please try again');
      }
    } catch {
      showToast('Network error — please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/shipping-rates/${id}`, { method: 'DELETE' });
      setRates((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      onRatesUpdated?.();
      showToast('Deleted');
    } catch {
      showToast('Delete failed');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyRate = (label: string, value: number) => {
    navigator.clipboard.writeText(String(value));
    setCopiedCell(label);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Courier Shipping Rate Sheets</h2>
            <p className="text-xs text-slate-500">Manage and save your negotiated rates by courier, destination &amp; weight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRates}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Rate Sheet
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-xl animate-fade-in flex items-center gap-2">
          <span>✨</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin border-[3px]" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && rates.length === 0 && !isFormOpen && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 text-orange-500 shadow-xs">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-slate-800 font-bold mb-1">No rate sheets added yet</h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-5 max-w-sm">
            Save your courier rates for USA, UK, Europe, etc. to automatically pull them into the Pricing Studio.
          </p>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Rate Sheet
          </button>
        </div>
      )}

      {/* Add / Edit Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-orange-200/80 shadow-md overflow-hidden">
          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-orange-50/40">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? 'Edit Courier Rate Sheet' : 'New Courier Rate Sheet'}
              </h3>
            </div>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Row 1: Courier + Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Courier Name *</label>
                <input
                  type="text"
                  list="couriers-list"
                  value={form.courier}
                  onChange={(e) => setForm((p) => ({ ...p, courier: e.target.value }))}
                  placeholder="e.g. DHL Express, FedEx, Skynet"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <datalist id="couriers-list">
                  {DEFAULT_COURIERS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Zone / Destination *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.zoneLabel}
                    onChange={(e) => setForm((p) => ({ ...p, zoneLabel: e.target.value }))}
                    placeholder="e.g. USA & Canada"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pr-24 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setZonePresetOpen((p) => !p)}
                    className="absolute right-1 top-1 text-[11px] px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-bold transition cursor-pointer"
                  >
                    Presets ↓
                  </button>
                </div>
                {zonePresetOpen && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 grid grid-cols-2 gap-1 p-2">
                    {Object.keys(ZONE_PRESETS).map((zone) => (
                      <button
                        key={zone}
                        onClick={() => applyZonePreset(zone)}
                        className="text-left text-xs font-medium px-2.5 py-1.5 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition cursor-pointer"
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Countries (tags) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <Globe className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
                Countries in this zone
                <span className="text-slate-400 font-normal ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.countries.join(', ')}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    countries: e.target.value
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="United States, Canada"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              {form.countries.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.countries.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 text-orange-800 rounded-full text-[11px] font-semibold border border-orange-200/50"
                    >
                      {c}
                      <button
                        onClick={() => setForm((p) => ({ ...p, countries: p.countries.filter((x) => x !== c) }))}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weight Slabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5 text-orange-600" />
                  Weight Slabs &amp; Costs ({form.currency})
                </label>
                <button
                  type="button"
                  onClick={addStandardWeights}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                >
                  + Auto-fill standard weights
                </button>
              </div>

              {form.weightSlabs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No weight slabs added. Click &quot;Auto-fill standard weights&quot; or add custom below.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {form.weightSlabs.map((slab, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-200/80"
                    >
                      <span className="text-xs font-bold text-slate-600 w-11 shrink-0">
                        {slab.weightKg} kg
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={slab.costPKR || ''}
                        onChange={(e) => updateSlab(idx, 'costPKR', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="flex-1 min-w-0 px-2.5 py-1 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                      />
                      <button
                        onClick={() => removeSlab(idx)}
                        className="text-slate-300 hover:text-red-500 transition shrink-0 cursor-pointer"
                        title="Remove slab"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom weight */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  placeholder="Custom weight in kg (e.g. 3.5)"
                  className="w-48 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-400"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomWeight()}
                />
                <button
                  type="button"
                  onClick={addCustomWeight}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  + Add Weight
                </button>
              </div>
            </div>

            {/* Row: Fuel Surcharge + Currency + Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Fuel Surcharge %</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={form.fuelSurchargePercent || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fuelSurchargePercent: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                  placeholder="PKR"
                  maxLength={5}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                <input
                  type="text"
                  value={form.notes || ''}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Account No: 123456"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Update Rate Sheet' : 'Save Rate Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Cards Grid */}
      {!isLoading && rates.length > 0 && (
        <div className="space-y-3">
          {rates.map((card) => {
            const id = card.id || card._id || '';
            const isExpanded = expandedCards.has(id);
            const surcharge = card.fuelSurchargePercent || 0;

            return (
              <div
                key={id}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition ${
                  card.isActive ? 'border-slate-200/90 hover:border-orange-200' : 'border-slate-100 opacity-60'
                }`}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                  <button
                    onClick={() => toggleExpand(id)}
                    className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                      <Truck className="w-4.5 h-4.5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {card.courier}
                        </span>
                        {!card.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                            Inactive
                          </span>
                        )}
                        {surcharge > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-200/60">
                            +{surcharge}% fuel surcharge
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-orange-600 font-bold">{card.zoneLabel}</span>
                        {card.countries.length > 0 && (
                          <span className="text-xs text-slate-400">
                            {card.countries.slice(0, 3).join(', ')}
                            {card.countries.length > 3 && ` +${card.countries.length - 3} more`}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          · {card.weightSlabs?.length || 0} weight slabs
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-auto" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditForm(card)}
                      className="p-2 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded rate table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/30">
                    {card.notes && (
                      <p className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-2 mb-3 font-medium">
                        📝 {card.notes}
                      </p>
                    )}

                    {card.weightSlabs && card.weightSlabs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70">
                              <th className="text-left py-2">Weight</th>
                              <th className="text-right py-2">
                                Base Rate ({card.currency})
                              </th>
                              {surcharge > 0 && (
                                <th className="text-right py-2 text-amber-700">
                                  With Surcharge
                                </th>
                              )}
                              <th className="text-right py-2 text-slate-400">≈ USD</th>
                              <th className="w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {card.weightSlabs.map((slab, idx) => {
                              const cellKey = `${id}-${idx}`;
                              const effective = surcharge
                                ? slab.costPKR * (1 + surcharge / 100)
                                : slab.costPKR;
                              return (
                                <tr key={idx} className="hover:bg-orange-50/30 group transition">
                                  <td className="py-2.5 text-slate-700 font-bold text-xs sm:text-sm">
                                    {slab.weightKg} kg
                                  </td>
                                  <td className="py-2.5 text-right text-slate-800 font-extrabold text-xs sm:text-sm">
                                    PKR {slab.costPKR.toLocaleString()}
                                  </td>
                                  {surcharge > 0 && (
                                    <td className="py-2.5 text-right text-amber-700 font-black text-xs sm:text-sm">
                                      PKR {Math.round(effective).toLocaleString()}
                                    </td>
                                  )}
                                  <td className="py-2.5 text-right text-slate-400 text-xs font-semibold">
                                    {exchangeRate > 0
                                      ? `$${(effective / exchangeRate).toFixed(2)}`
                                      : '—'}
                                  </td>
                                  <td className="py-2.5 pl-2">
                                    <button
                                      onClick={() => copyRate(cellKey, Math.round(effective))}
                                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 transition cursor-pointer p-1"
                                      title="Copy cost to clipboard"
                                    >
                                      {copiedCell === cellKey ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No weight slabs defined.</p>
                    )}

                    {/* All countries */}
                    {card.countries.length > 3 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-semibold mb-1.5">Destinations included:</p>
                        <div className="flex flex-wrap gap-1">
                          {card.countries.map((c) => (
                            <span
                              key={c}
                              className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Delete Rate Sheet?</h3>
                <p className="text-xs text-slate-500">This action will remove this courier rate sheet permanently.</p>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
