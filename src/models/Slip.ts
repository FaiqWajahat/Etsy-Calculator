import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISlipDoc extends Document {
  title: string;
  cloudinaryUrl: string;
  publicId?: string;
  netSellingPriceUSD: number;
  originalPriceUSD?: number;
  discountPercent?: number;
  netProfitLocal: number;
  costCurrency: string;
  listingCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlipSchema = new Schema<ISlipDoc>(
  {
    title: { type: String, required: true, default: 'Etsy Pricing Slip' },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, default: '' },
    netSellingPriceUSD: { type: Number, default: 0 },
    originalPriceUSD: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    netProfitLocal: { type: Number, default: 0 },
    costCurrency: { type: String, default: 'PKR' },
    listingCurrency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

export const SlipModel: Model<ISlipDoc> =
  mongoose.models.Slip || mongoose.model<ISlipDoc>('Slip', SlipSchema);
