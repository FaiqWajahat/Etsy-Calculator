import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiListingDoc extends Document {
  title: string;
  concept: string;
  material?: string;
  tags: string[];
  alternativeTitles: string[];
  metaDescription?: string;
  bulletPoints: string[];
  fullDescription?: string;
  personalizationInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiListingSchema = new Schema<IAiListingDoc>(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled Etsy Listing' },
    concept: { type: String, default: '' },
    material: { type: String, default: '' },
    tags: { type: [String], default: [] },
    alternativeTitles: { type: [String], default: [] },
    metaDescription: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] },
    fullDescription: { type: String, default: '' },
    personalizationInstructions: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AiListingModel: Model<IAiListingDoc> =
  mongoose.models.AiListing || mongoose.model<IAiListingDoc>('AiListing', AiListingSchema);
