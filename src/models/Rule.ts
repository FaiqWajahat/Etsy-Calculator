import mongoose, { Schema, Document, Model } from 'mongoose';
import { ShopCustomRule } from '@/types/calculator';

export interface IRuleDoc extends Document, ShopCustomRule {
  shopName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In Next.js dev server, mongoose.models persists across hot reloads.
// We must delete the cached model so schema updates take effect immediately.
if (mongoose.models && mongoose.models.Rule) {
  delete (mongoose.models as Record<string, unknown>).Rule;
}

const RuleSchema = new Schema<IRuleDoc>(
  {
    shopName: { type: String, default: 'My Etsy Shop' },
    minProfitMargin: { type: Number, default: 30 },
    minProfitAmountUSD: { type: Number, default: 5 },
    defaultPlatformFeePercent: { type: Number, default: 15 },
    defaultDiscountPercent: { type: Number, default: 0 },
    maxFeePercentage: { type: Number },
    freeShippingWarning: { type: Boolean },
  },
  { timestamps: true, strict: false }
);

export const RuleModel: Model<IRuleDoc> =
  mongoose.models.Rule || mongoose.model<IRuleDoc>('Rule', RuleSchema);
