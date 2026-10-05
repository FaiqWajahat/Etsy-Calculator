'use client';

import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  itemType?: 'listing' | 'invoice' | 'item';
  description?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'listing',
  description,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const defaultTitle =
    title ||
    (itemType === 'invoice'
      ? 'Delete Cloud Invoice Slip?'
      : 'Delete Saved Listing?');

  const defaultDescription =
    description ||
    (itemType === 'invoice'
      ? 'Are you sure you want to remove this receipt slip? This link will no longer appear in your saved receipts.'
      : 'Are you sure you want to permanently delete this saved listing? This action cannot be undone.');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{defaultTitle}</h3>
              <p className="text-[11px] text-slate-500">Confirm permanent deletion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span className="text-xs font-bold text-slate-800 truncate">{itemName}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            {defaultDescription}
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-[11px] font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Warning: Deletion is permanent and cannot be reversed.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
