'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tags,
  Copy,
  Check,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  Wand2,
  RefreshCw,
  Key,
  ExternalLink,
  ArrowRight,
  Lightbulb,
  Smartphone,
  Layers,
  FileText,
  BookmarkCheck,
  HelpCircle,
  Database,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle,
  Save,
  FolderOpen,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { SavedListingItem } from '@/types/calculator';

export interface SavedAiListingItem {
  _id: string;
  id?: string;
  title: string;
  concept: string;
  material?: string;
  tags: string[];
  alternativeTitles: string[];
  metaDescription?: string;
  bulletPoints: string[];
  fullDescription?: string;
  personalizationInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListingSeoHelperProps {
  initialTitle?: string;
  initialTags?: string[];
  initialMaterial?: string;
  initialFullDescription?: string;
  initialPersonalizationInstructions?: string;
  initialAlternativeTitles?: string[];
  initialMetaDescription?: string;
  initialBulletPoints?: string[];
  activeListingId?: string | null;
  onTagsChange?: (tags: string[]) => void;
  onApplyToStudio?: (seoData: {
    title: string;
    tags: string[];
    material?: string;
    fullDescription?: string;
    personalizationInstructions?: string;
    alternativeTitles?: string[];
    metaDescription?: string;
    bulletPoints?: string[];
  }) => void;
  onSeoStateChange?: (updated: {
    title?: string;
    tags?: string[];
    material?: string;
    fullDescription?: string;
    personalizationInstructions?: string;
    alternativeTitles?: string[];
    metaDescription?: string;
    bulletPoints?: string[];
  }) => void;
  onSaveToMainDb?: () => Promise<void>;
  savedListings?: SavedListingItem[];
  onLoadSavedListing?: (item: SavedListingItem) => void;
}

export const ListingSeoHelper: React.FC<ListingSeoHelperProps> = ({
  initialTitle = '',
  initialTags = [],
  initialMaterial = '',
  initialFullDescription = '',
  initialPersonalizationInstructions = '',
  initialAlternativeTitles = [],
  initialMetaDescription = '',
  initialBulletPoints = [],
  activeListingId,
  onTagsChange,
  onApplyToStudio,
  onSeoStateChange,
  onSaveToMainDb,
  savedListings = [],
  onLoadSavedListing,
}) => {
  // Title & Tags State
  const [title, setTitle] = useState(initialTitle || '');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');

  // AI Generator Inputs
  const [concept, setConcept] = useState(initialTitle || '');
  const [material, setMaterial] = useState(initialMaterial || '');

  // AI Output State
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isMissingKey, setIsMissingKey] = useState<boolean>(false);
  const [alternativeTitles, setAlternativeTitles] = useState<string[]>(initialAlternativeTitles);
  const [metaDescription, setMetaDescription] = useState<string>(initialMetaDescription || '');
  const [bulletPoints, setBulletPoints] = useState<string[]>(initialBulletPoints);
  const [fullDescription, setFullDescription] = useState<string>(initialFullDescription || '');
  const [personalizationInstructions, setPersonalizationInstructions] = useState<string>(
    initialPersonalizationInstructions || ''
  );

  // Active Tab for Description Studio
  const [descTab, setDescTab] = useState<'full' | 'personalization' | 'bullets'>('full');

  // Copy Feedback States
  const [copiedAllTags, setCopiedAllTags] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);
  const [copiedFullDesc, setCopiedFullDesc] = useState(false);
  const [copiedPersInstructions, setCopiedPersInstructions] = useState(false);
  const [copiedTagIndex, setCopiedTagIndex] = useState<number | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  // Saved AI Listings from MongoDB (dedicated or main)
  const [savedAiListings, setSavedAiListings] = useState<SavedAiListingItem[]>([]);
  const [editingAiId, setEditingAiId] = useState<string | null>(activeListingId || null);
  const [editingAiTitle, setEditingAiTitle] = useState<string | null>(initialTitle || null);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbToast, setDbToast] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<SavedAiListingItem | null>(null);
  const [isDeletingDb, setIsDeletingDb] = useState(false);

  // Load dedicated AI listings
  const loadSavedAiListings = async () => {
    try {
      const res = await fetch('/api/ai-listings');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSavedAiListings(data.data);
      }
    } catch (err) {
      console.warn('Could not load saved AI listings:', err);
    }
  };

  useEffect(() => {
    loadSavedAiListings();
  }, []);

  // Sync props when parent updates
  useEffect(() => {
    if (initialTitle && !title) {
      setTitle(initialTitle);
      setConcept(initialTitle);
    }
  }, [initialTitle, title]);

  useEffect(() => {
    if (initialTags && initialTags.length > 0 && tags.length === 0) {
      setTags(initialTags);
    }
  }, [initialTags, tags.length]);

  useEffect(() => {
    if (initialMaterial && !material) {
      setMaterial(initialMaterial);
    }
  }, [initialMaterial, material]);

  useEffect(() => {
    if (initialFullDescription && !fullDescription) {
      setFullDescription(initialFullDescription);
    }
  }, [initialFullDescription, fullDescription]);

  useEffect(() => {
    if (initialPersonalizationInstructions && !personalizationInstructions) {
      setPersonalizationInstructions(initialPersonalizationInstructions);
    }
  }, [initialPersonalizationInstructions, personalizationInstructions]);

  // RESET / CLEAR ALL FIELDS
  const handleResetAll = () => {
    setConcept('');
    setMaterial('');
    setTitle('');
    setTags([]);
    setAlternativeTitles([]);
    setMetaDescription('');
    setBulletPoints([]);
    setFullDescription('');
    setPersonalizationInstructions('');
    setEditingAiId(null);
    setEditingAiTitle(null);
    setAiError(null);
    setTagError('');

    if (onTagsChange) onTagsChange([]);
    if (onSeoStateChange) {
      onSeoStateChange({
        title: '',
        tags: [],
        material: '',
        fullDescription: '',
        personalizationInstructions: '',
        alternativeTitles: [],
        metaDescription: '',
        bulletPoints: [],
      });
    }

    setDbToast('Fields reset. Ready for a new listing!');
    setTimeout(() => setDbToast(null), 2500);
  };

  // SAVE OR UPDATE TO DATABASE (MONGODB ATLAS)
  const handleSaveToDb = async () => {
    const finalTitle = title.trim() || concept.trim() || 'Untitled Etsy Listing';
    setIsSavingDb(true);

    // 1. Notify parent state so page.tsx is immediately in sync
    if (onSeoStateChange) {
      onSeoStateChange({
        title: finalTitle,
        tags,
        material: material.trim(),
        fullDescription: fullDescription.trim(),
        personalizationInstructions: personalizationInstructions.trim(),
        alternativeTitles,
        metaDescription: metaDescription.trim(),
        bulletPoints,
      });
    }

    try {
      // 2. If parent has onSaveToMainDb, save directly to the main MongoDB listings collection!
      if (onSaveToMainDb) {
        await onSaveToMainDb();
      }

      // 3. Also save to the dedicated /api/ai-listings collection
      const payload = {
        title: finalTitle,
        concept: concept.trim() || finalTitle,
        material: material.trim(),
        tags,
        alternativeTitles,
        metaDescription,
        bulletPoints,
        fullDescription,
        personalizationInstructions,
      };

      if (editingAiId && !editingAiId.startsWith('local_')) {
        await fetch(`/api/ai-listings/${editingAiId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch('/api/ai-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data?._id) {
          setEditingAiId(data.data._id);
          setEditingAiTitle(finalTitle);
        }
      }

      await loadSavedAiListings();
      setDbToast(`Saved "${finalTitle}" to your library! (SEO, Tags & Copywriting)`);
    } catch (err) {
      console.error('Save to DB error:', err);
      setDbToast('Saved locally.');
    } finally {
      setIsSavingDb(false);
      setTimeout(() => setDbToast(null), 3000);
    }
  };

  // LOAD SAVED LISTING INTO EDITOR
  const handleLoadSavedItem = (item: SavedAiListingItem) => {
    setTitle(item.title || '');
    setConcept(item.concept || item.title || '');
    setMaterial(item.material || '');
    const loadedTags = Array.isArray(item.tags) ? item.tags : [];
    setTags(loadedTags);
    if (onTagsChange) onTagsChange(loadedTags);

    const alts = Array.isArray(item.alternativeTitles) ? item.alternativeTitles : [];
    setAlternativeTitles(alts);
    setMetaDescription(item.metaDescription || '');
    const bullets = Array.isArray(item.bulletPoints) ? item.bulletPoints : [];
    setBulletPoints(bullets);
    setFullDescription(item.fullDescription || '');
    setPersonalizationInstructions(item.personalizationInstructions || '');

    const itemId = item._id || item.id || '';
    setEditingAiId(itemId);
    setEditingAiTitle(item.title || '');

    if (onSeoStateChange) {
      onSeoStateChange({
        title: item.title,
        tags: loadedTags,
        material: item.material,
        fullDescription: item.fullDescription,
        personalizationInstructions: item.personalizationInstructions,
        alternativeTitles: alts,
        metaDescription: item.metaDescription,
        bulletPoints: bullets,
      });
    }

    setIsDrawerOpen(false);
    setDbToast(`Loaded "${item.title}" into editor!`);
    setTimeout(() => setDbToast(null), 2500);
  };

  // DELETE SAVED LISTING
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const deleteId = itemToDelete._id || itemToDelete.id;
    if (!deleteId) return;

    setIsDeletingDb(true);
    try {
      const res = await fetch(`/api/ai-listings/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedAiListings((prev) => prev.filter((i) => (i._id || i.id) !== deleteId));
        if (editingAiId === deleteId) {
          setEditingAiId(null);
          setEditingAiTitle(null);
        }
        setDbToast(`Deleted "${itemToDelete.title}" from database.`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDbToast('Error deleting listing.');
    } finally {
      setIsDeletingDb(false);
      setItemToDelete(null);
      setTimeout(() => setDbToast(null), 2500);
    }
  };

  // Handle Tag Management
  const handleAddTag = () => {
    const trimmed = tagInput
      .replace(/[#,/\\.'"]/g, '')
      .trim()
      .toLowerCase();

    if (!trimmed) return;

    if (tags.length >= 13) {
      setTagError('Etsy strictly limits listings to exactly 13 tags.');
      return;
    }

    if (trimmed.length > 20) {
      setTagError(`Each tag must be 20 characters or fewer. "${trimmed}" is ${trimmed.length} characters.`);
      return;
    }

    if (tags.includes(trimmed)) {
      setTagError('This tag is already in your 13 tags list.');
      return;
    }

    const updated = [...tags, trimmed];
    setTags(updated);
    setTagInput('');
    setTagError('');
    if (onTagsChange) onTagsChange(updated);
    if (onSeoStateChange) onSeoStateChange({ tags: updated });
  };

  const handleRemoveTag = (index: number) => {
    const updated = tags.filter((_, i) => i !== index);
    setTags(updated);
    if (onTagsChange) onTagsChange(updated);
    if (onSeoStateChange) onSeoStateChange({ tags: updated });
  };

  const handleClearTags = () => {
    setTags([]);
    if (onTagsChange) onTagsChange([]);
    if (onSeoStateChange) onSeoStateChange({ tags: [] });
  };

  // Copy helpers
  const handleCopyAllTags = () => {
    if (tags.length === 0) return;
    navigator.clipboard.writeText(tags.join(', '));
    setCopiedAllTags(true);
    setTimeout(() => setCopiedAllTags(false), 2000);
  };

  const handleCopyTagSingle = (tag: string, index: number) => {
    navigator.clipboard.writeText(tag);
    setCopiedTagIndex(index);
    setTimeout(() => setCopiedTagIndex(null), 1500);
  };

  const handleCopyTitle = () => {
    if (!title) return;
    navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyFullDesc = () => {
    if (!fullDescription) return;
    navigator.clipboard.writeText(fullDescription);
    setCopiedFullDesc(true);
    setTimeout(() => setCopiedFullDesc(false), 2000);
  };

  const handleCopyPersInstructions = () => {
    if (!personalizationInstructions) return;
    navigator.clipboard.writeText(personalizationInstructions);
    setCopiedPersInstructions(true);
    setTimeout(() => setCopiedPersInstructions(false), 2000);
  };

  const handleCopyMetaDesc = () => {
    if (!metaDescription) return;
    navigator.clipboard.writeText(metaDescription);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleCopyBullets = () => {
    if (bulletPoints.length === 0) return;
    navigator.clipboard.writeText(bulletPoints.map((b) => `• ${b}`).join('\n'));
    setCopiedBullets(true);
    setTimeout(() => setCopiedBullets(false), 2000);
  };

  // Apply to Studio
  const handleApply = () => {
    if (onApplyToStudio) {
      onApplyToStudio({
        title,
        tags,
        material,
        fullDescription,
        personalizationInstructions,
        alternativeTitles,
        metaDescription,
        bulletPoints,
      });
      setAppliedToast(true);
      setTimeout(() => setAppliedToast(false), 2500);
    }
  };

  // Call Gemini AI Generation API
  const handleGenerateAi = async () => {
    const promptText = concept.trim() || title.trim();
    if (!promptText) {
      setAiError('Please enter a product title or concept first.');
      return;
    }

    setIsLoadingAi(true);
    setAiError(null);
    setIsMissingKey(false);

    try {
      const res = await fetch('/api/ai-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: promptText,
          materials: material.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.missingKey) {
          setIsMissingKey(true);
          setAiError(data.error);
        } else {
          setAiError(data.error || 'Failed to generate listing tags from AI.');
        }
        return;
      }

      if (data.data) {
        const newTitle = data.data.primaryTitle || promptText;
        const newTags = Array.isArray(data.data.tags) ? data.data.tags : [];
        const newAlts = Array.isArray(data.data.alternativeTitles) ? data.data.alternativeTitles : [];
        const newMeta = data.data.metaDescription || '';
        const newBullets = Array.isArray(data.data.bulletPoints) ? data.data.bulletPoints : [];
        const newDesc = data.data.fullDescription || '';
        const newPers = data.data.personalizationInstructions || '';

        setTitle(newTitle);
        setTags(newTags);
        setAlternativeTitles(newAlts);
        setMetaDescription(newMeta);
        setBulletPoints(newBullets);
        setFullDescription(newDesc);
        setPersonalizationInstructions(newPers);

        if (onTagsChange) onTagsChange(newTags);
        if (onSeoStateChange) {
          onSeoStateChange({
            title: newTitle,
            tags: newTags,
            material: material.trim(),
            fullDescription: newDesc,
            personalizationInstructions: newPers,
            alternativeTitles: newAlts,
            metaDescription: newMeta,
            bulletPoints: newBullets,
          });
        }
      }
    } catch (err: unknown) {
      console.error('AI Generation Request Failed:', err);
      setAiError('Network error connecting to AI service. Please check your internet connection.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Filtered saved listings for Drawer
  const filteredSavedListings = useMemo(() => {
    if (!drawerSearch.trim()) return savedAiListings;
    const q = drawerSearch.toLowerCase();
    return savedAiListings.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.material && item.material.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [savedAiListings, drawerSearch]);

  const titleLength = title.length;
  const isTitleOptimal = titleLength >= 60 && titleLength <= 130;
  const isTitleOverLimit = titleLength > 140;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {dbToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-bounce flex items-center space-x-2">
          <span>✨ {dbToast}</span>
        </div>
      )}


      {/* Editing Mode Banner (If loaded) */}
      {editingAiId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-medium">
            <Database className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Editing listing: <strong className="font-bold text-amber-950">&quot;{editingAiTitle || title}&quot;</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveToDb}
              disabled={isSavingDb}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDb ? 'Saving...' : 'Update Listing'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition"
            >
              Start New Listing
            </button>
          </div>
        </div>
      )}

      {/* Missing API Key Guidance Banner */}
      {isMissingKey && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-amber-900 shadow-xs space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-700 shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-amber-950">
                Google Gemini API Key Required
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                To activate AI generation for high-converting titles and 13 Etsy search tags, you just need a free API key from Google AI Studio.
              </p>
            </div>
          </div>

          <div className="bg-white/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-800">Quick 2-Step Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>
                Get your free API key at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-orange-600 underline inline-flex items-center gap-1 hover:text-orange-700"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Open the file <code className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono font-bold">.env.local</code> in your project root, find <code className="font-mono text-orange-700">GEMINI_API_KEY=</code>, paste your key, and save!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* 2. Fast AI Generator Card (Title + Material + Reset) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI Listing Generator
              </h2>
              <p className="text-xs text-slate-500">
                Enter your product title and material — Gemini AI handles the rest
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* RESET / CLEAR ALL BUTTON */}
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition inline-flex items-center gap-1.5"
              title="Reset all fields to start a new listing"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fields</span>
            </button>

            {/* Saved Listings Library Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="text-xs font-bold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-orange-50/60 transition inline-flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-orange-500" />
              <span>Saved Listings ({savedAiListings.length || savedListings.length})</span>
            </button>

            {/* Apply to Pricing Studio Button */}
            {onApplyToStudio && (title || tags.length > 0) && (
              <button
                type="button"
                onClick={handleApply}
                className="text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>{appliedToast ? 'Applied! ✓' : 'Apply to Studio'}</span>
              </button>
            )}

            {initialTitle && initialTitle !== concept && (
              <button
                type="button"
                onClick={() => {
                  setConcept(initialTitle);
                  setTitle(initialTitle);
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Import Studio Title</span>
              </button>
            )}
          </div>
        </div>

        {/* Form: Just Title and Material */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Field 1: Title / Concept (2 cols) */}
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Product Title / Concept <span className="text-rose-500">*</span></span>
              <span className="text-xs font-normal text-slate-400">What are you selling?</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Personalized Leather Wallet, Ceramic Coffee Mug, Linen Dress"
              value={concept}
              onChange={(e) => {
                setConcept(e.target.value);
                setAiError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoadingAi) {
                  e.preventDefault();
                  handleGenerateAi();
                }
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition"
            />
          </div>

          {/* Field 2: Material (1 col) */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Material <span className="text-xs font-normal text-slate-400">(Optional)</span></span>
            </label>
            <input
              type="text"
              placeholder="e.g. Full Grain Leather, Ceramic, Solid Wood"
              value={material}
              onChange={(e) => {
                setMaterial(e.target.value);
                if (onSeoStateChange) onSeoStateChange({ material: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoadingAi) {
                  e.preventDefault();
                  handleGenerateAi();
                }
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* AI Action Button & Save to DB Row */}
        <div className="space-y-3 pt-2">
          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isLoadingAi || !concept.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Etsy SEO & 13 Tags...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate High-Converting Etsy Listing</span>
                </>
              )}
            </button>

            {/* SAVE TO DB BUTTON */}
            {(title || tags.length > 0 || fullDescription) && (
              <button
                type="button"
                onClick={handleSaveToDb}
                disabled={isSavingDb}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2 active:scale-95 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSavingDb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Listing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Save Listing</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Title Optimizer & Alternative Angles */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Etsy Listing Title Optimizer
              </h3>
              <p className="text-xs text-slate-500">
                Primary search keywords first (mobile buyer view) • Strict 140 character limit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isTitleOverLimit
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : isTitleOptimal
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {titleLength} / 140 chars {isTitleOptimal && '✓ Optimal'}
            </span>

            {title && (
              <button
                type="button"
                onClick={handleCopyTitle}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Copy Title"
              >
                {copiedTitle ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <textarea
            rows={3}
            placeholder="e.g. Personalized Leather Wallet for Men, Custom Bifold Wallet, 3rd Anniversary Gift for Husband, Monogrammed Gift"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (onSeoStateChange) onSeoStateChange({ title: e.target.value });
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition leading-relaxed"
          />

          {/* Mobile Cutoff Preview Banner */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Mobile Search Cutoff:</strong> &quot;
                <span className="font-semibold text-slate-900">
                  {title ? title.substring(0, 42) : 'Your primary search keyword appears here'}
                </span>
                ...&quot;
              </span>
            </div>
            <span className="text-2xs text-slate-500">
              (Etsy app displays ~40 characters on mobile search results)
            </span>
          </div>
        </div>

        {/* AI Alternative Titles (If generated) */}
        {alternativeTitles.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Alternative Title Angles (Suggested by AI):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alternativeTitles.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2 hover:bg-amber-50 transition"
                >
                  <div className="flex items-center justify-between text-2xs text-amber-800 font-semibold">
                    <span>Angle #{idx + 1} ({idx === 0 ? 'Gift-Focused' : 'Craft & Feature-Focused'})</span>
                    <span>{alt.length} chars</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-snug">{alt}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(alt);
                      if (onSeoStateChange) onSeoStateChange({ title: alt });
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center space-x-1 pt-1"
                  >
                    <span>Use this title</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. The 13 Tags Studio */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Etsy 13 Search Tags Studio
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    tags.length === 13
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}
                >
                  {tags.length} / 13 Tags
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Etsy search algorithm rule: Strictly &le; 20 characters per tag, exactly 13 tags recommended
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {tags.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyAllTags}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold border border-orange-200 transition"
                  title="Copy comma-separated tags to paste directly into Etsy listing manager"
                >
                  {copiedAllTags ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAllTags ? 'Copied 13 Tags!' : 'Copy All 13 Tags'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearTags}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-50 transition"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tag Input Field */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Add custom tag (e.g. personalized gift)..."
                value={tagInput}
                maxLength={20}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setTagError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={tags.length >= 13}
                className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-semibold text-slate-400">
                {tagInput.length}/20
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddTag}
              disabled={tags.length >= 13 || !tagInput.trim()}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {tagError && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{tagError}</span>
            </p>
          )}
        </div>

        {/* Tag Cards Grid */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-24">
          {tags.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-500">No tags in list</p>
              <p className="text-2xs text-slate-400">
                Click &quot;Generate High-Converting Etsy Listing&quot; above to populate all 13 algorithm-optimized tags in seconds.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tags.map((tag, idx) => {
                const charLen = tag.length;
                const isOver = charLen > 20;
                const isCopied = copiedTagIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-orange-300 transition group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="text-2xs font-bold text-slate-400">#{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{tag}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`text-3xs font-mono font-bold px-1.5 py-0.5 rounded ${
                          isOver
                            ? 'bg-rose-100 text-rose-700'
                            : charLen >= 17
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {charLen}/20
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyTagSingle(tag, idx)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Copy single tag"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Etsy Copy Instructions Tip */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start space-x-2.5 text-xs text-blue-900">
          <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Etsy Seller Shortcut:</strong> Click &quot;Copy All 13 Tags&quot; above, then in your Etsy listing editor,
            click into the &quot;Tags&quot; field and paste (<kbd className="px-1 bg-white rounded border border-blue-200 font-mono">Ctrl+V</kbd>).
            Etsy will automatically separate them into all 13 chips!
          </p>
        </div>
      </div>

      {/* 5. Professional Product Description & Copywriting Studio (PERMANENTLY VISIBLE) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Product Description & Copywriting Studio
              </h3>
              <p className="text-xs text-slate-500">
                High-converting product description, Personalization guide, Dimensions, and Care instructions
              </p>
            </div>
          </div>

          {/* Sub-Tabs for Description */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setDescTab('full')}
              className={`px-3 py-1.5 rounded-xl transition ${
                descTab === 'full' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Full Description
            </button>
            <button
              type="button"
              onClick={() => setDescTab('personalization')}
              className={`px-3 py-1.5 rounded-xl transition ${
                descTab === 'personalization' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Personalization Box
            </button>
            <button
              type="button"
              onClick={() => setDescTab('bullets')}
              className={`px-3 py-1.5 rounded-xl transition ${
                descTab === 'bullets' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              SEO Hook & Bullets
            </button>
          </div>
        </div>

        {/* TAB 1: FULL ETSY DESCRIPTION */}
        {descTab === 'full' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">
                  Complete Ready-to-Paste Etsy Listing Description:
                </span>
                <span className="text-2xs text-slate-400">
                  ({fullDescription.length} characters • {fullDescription.trim() ? fullDescription.trim().split(/\s+/).length : 0} words)
                </span>
              </div>
              {fullDescription && (
                <button
                  type="button"
                  onClick={handleCopyFullDesc}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {copiedFullDesc ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFullDesc ? 'Copied Full Description!' : 'Copy Entire Description'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={12}
              value={fullDescription}
              onChange={(e) => {
                setFullDescription(e.target.value);
                if (onSeoStateChange) onSeoStateChange({ fullDescription: e.target.value });
              }}
              placeholder="Your high-converting Etsy listing description will be generated here by AI (including hook, product specifications, dimensions, materials, gift packaging, and care guide), or you can write and edit directly..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition"
            />
          </div>
        )}

        {/* TAB 2: PERSONALIZATION FIELD INSTRUCTIONS */}
        {descTab === 'personalization' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Etsy &quot;Personalization Instructions for Buyers&quot; Text
                </h4>
                <p className="text-2xs text-slate-500">
                  Paste this directly into the instructions box of Etsy&apos;s personalization field.
                </p>
              </div>
              {personalizationInstructions && (
                <button
                  type="button"
                  onClick={handleCopyPersInstructions}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-xs font-bold transition"
                >
                  {copiedPersInstructions ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPersInstructions ? 'Copied Instructions!' : 'Copy Instructions'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={personalizationInstructions}
              onChange={(e) => {
                setPersonalizationInstructions(e.target.value);
                if (onSeoStateChange) onSeoStateChange({ personalizationInstructions: e.target.value });
              }}
              placeholder="e.g. Please enter your custom name or initials (max 10 characters) and font preference. Enter 'None' if you do not want engraving."
              className="w-full p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs text-slate-800 font-medium leading-relaxed focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition"
            />

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start space-x-2 text-xs text-blue-900">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Etsy Pro Tip:</strong> Giving buyers a clear, strict character limit and exact example reduces buyer messaging delays by over 80%!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SEO BULLETS & HOOK */}
        {descTab === 'bullets' && (
          <div className="space-y-5">
            {/* Meta Hook */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Google Search Meta Hook ({metaDescription.length} chars)
                </label>
                {metaDescription && (
                  <button
                    type="button"
                    onClick={handleCopyMetaDesc}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDesc ? 'Copied!' : 'Copy Hook'}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  if (onSeoStateChange) onSeoStateChange({ metaDescription: e.target.value });
                }}
                placeholder="Google & Etsy search snippet hook (120-155 characters)..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition"
              />
            </div>

            {/* Bullets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Top Product Highlights & Bullets
                </label>
                {bulletPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyBullets}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    {copiedBullets ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBullets ? 'Copied All Bullets!' : 'Copy Bullets'}</span>
                  </button>
                )}
              </div>

              {bulletPoints.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Product highlights will appear here after AI generation.
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-800">
                  {bulletPoints.map((pt, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span className="font-medium leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Saved AI Listings Drawer / Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Saved Listings Library ({savedAiListings.length || savedListings.length})
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Stored securely in your library • Load, edit, or delete any listing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search saved listings by title, material, or tag..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Listings List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredSavedListings.length === 0 && savedListings.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Database className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No saved listings found</p>
                  <p className="text-2xs text-slate-400 max-w-xs mx-auto">
                    Generate an AI listing and click &quot;Save Listing&quot; to keep it here for future reference.
                  </p>
                </div>
              ) : (
                (filteredSavedListings.length > 0 ? filteredSavedListings : (savedListings.map(s => ({
                  _id: (s._id || s.id || '') as string,
                  id: (s._id || s.id || '') as string,
                  title: s.title,
                  concept: s.title,
                  material: s.material || '',
                  tags: s.listingTags || [],
                  alternativeTitles: s.alternativeTitles || [],
                  metaDescription: s.metaDescription || '',
                  bulletPoints: s.bulletPoints || [],
                  fullDescription: s.fullDescription || '',
                  personalizationInstructions: s.personalizationInstructions || '',
                  createdAt: s.createdAt || '',
                  updatedAt: s.updatedAt || '',
                })) as SavedAiListingItem[])).map((item: SavedAiListingItem) => {
                  const itemId = item._id || item.id || '';
                  const isCurrent = editingAiId === itemId;
                  const tagCount = Array.isArray(item.tags) ? item.tags.length : 0;

                  return (
                    <div
                      key={itemId}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        isCurrent
                          ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-3xs shrink-0">
                                Currently Loaded
                              </span>
                            )}
                          </div>
                          {item.material && (
                            <p className="text-2xs text-slate-500 font-medium">
                              Material: <span className="text-slate-700 font-semibold">{item.material}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadSavedItem(item);
                              if (onLoadSavedListing) {
                                const found = savedListings.find(s => (s._id || s.id) === itemId);
                                if (found) onLoadSavedListing(found);
                              }
                            }}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                          >
                            Load
                          </button>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tags Preview */}
                      {tagCount > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-3xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {tagCount} Tags
                          </span>
                          {item.tags.slice(0, 5).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-3xs px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"
                            >
                              #{t}
                            </span>
                          ))}
                          {tagCount > 5 && (
                            <span className="text-3xs text-slate-400 self-center">
                              +{tagCount - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-2xs text-slate-500">
              <span>{savedAiListings.length || savedListings.length} total saved listings in database</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="font-bold text-slate-700 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDeleteItem}
          title="Delete Saved AI Listing?"
          itemName={itemToDelete.title}
          itemType="listing"
          description={`Are you sure you want to permanently delete "${itemToDelete.title}" and its 13 tags from your library? This action cannot be undone.`}
          isDeleting={isDeletingDb}
        />
      )}
    </div>
  );
};
