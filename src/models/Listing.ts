import mongoose, { Schema, Document, Model } from 'mongoose';
import { CalculatorInputs, CalculationResult } from '@/types/calculator';

export interface IListingDoc extends Document {
  title: string;
  sku?: string;
  category?: string;
  listingType: 'physical' | 'digital' | 'pod';
  inputs: CalculatorInputs;
  studioPricing?: Record<string, unknown>;
  results: CalculationResult;
  listingTags?: string[];
  notes?: string;
  cloudinarySlipUrl?: string;
  material?: string;
  fullDescription?: string;
  personalizationInstructions?: string;
  alternativeTitles?: string[];
  metaDescription?: string;
  bulletPoints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListingDoc>(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled Etsy Listing' },
    sku: { type: String, default: '' },
    category: { type: String, default: 'General' },
    listingType: { type: String, enum: ['physical', 'digital', 'pod'], default: 'physical' },
    inputs: { type: Schema.Types.Mixed, default: {} },
    studioPricing: { type: Schema.Types.Mixed, default: null },
    results: { type: Schema.Types.Mixed, default: {} },
    listingTags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    cloudinarySlipUrl: { type: String, default: '' },
    material: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    personalizationInstructions: { type: String, default: '' },
    alternativeTitles: { type: [String], default: [] },
    metaDescription: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ListingModel: Model<IListingDoc> =
  mongoose.models.Listing || mongoose.model<IListingDoc>('Listing', ListingSchema);
