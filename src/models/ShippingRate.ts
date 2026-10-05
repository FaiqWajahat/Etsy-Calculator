import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShippingRateDoc extends Document {
  courier: string;
  zoneLabel: string;
  countries: string[];
  weightSlabs: Array<{ weightKg: number; costPKR: number }>;
  currency: string;
  fuelSurchargePercent?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WeightSlabSchema = new Schema(
  {
    weightKg: { type: Number, required: true },
    costPKR: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const ShippingRateSchema = new Schema<IShippingRateDoc>(
  {
    courier: { type: String, required: true, trim: true },
    zoneLabel: { type: String, required: true, trim: true },
    countries: { type: [String], default: [] },
    weightSlabs: { type: [WeightSlabSchema], default: [] },
    currency: { type: String, default: 'PKR' },
    fuelSurchargePercent: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ShippingRateModel: Model<IShippingRateDoc> =
  mongoose.models.ShippingRate ||
  mongoose.model<IShippingRateDoc>('ShippingRate', ShippingRateSchema);
