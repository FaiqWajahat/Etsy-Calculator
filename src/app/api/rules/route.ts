import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { RuleModel } from '@/models/Rule';
import { DEFAULT_RULES } from '@/lib/constants';

let inMemoryRules = { ...DEFAULT_RULES };

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const rule = await RuleModel.findOne({}).lean();
      if (rule) {
        const doc = rule as Record<string, unknown>;
        const data = {
          ...DEFAULT_RULES,
          ...doc,
          minProfitMargin:
            typeof doc.minProfitMargin === 'number'
              ? doc.minProfitMargin
              : DEFAULT_RULES.minProfitMargin,
          minProfitAmountUSD:
            typeof doc.minProfitAmountUSD === 'number'
              ? doc.minProfitAmountUSD
              : DEFAULT_RULES.minProfitAmountUSD,
          defaultPlatformFeePercent:
            typeof doc.defaultPlatformFeePercent === 'number'
              ? doc.defaultPlatformFeePercent
              : DEFAULT_RULES.defaultPlatformFeePercent,
          defaultDiscountPercent:
            typeof doc.defaultDiscountPercent === 'number'
              ? doc.defaultDiscountPercent
              : doc.defaultDiscountPercent !== undefined &&
                doc.defaultDiscountPercent !== null &&
                doc.defaultDiscountPercent !== ''
              ? Number(doc.defaultDiscountPercent)
              : (DEFAULT_RULES.defaultDiscountPercent ?? 0),
        };
        return NextResponse.json({ success: true, data });
      }
    }
  } catch (err) {
    console.warn('MongoDB query for rules failed:', err);
  }

  return NextResponse.json({ success: true, data: inMemoryRules });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const minMargin =
      typeof body.minProfitMargin === 'number'
        ? body.minProfitMargin
        : parseFloat(body.minProfitMargin) || 30;

    const minProfitUsd =
      typeof body.minProfitAmountUSD === 'number'
        ? body.minProfitAmountUSD
        : parseFloat(body.minProfitAmountUSD) || 5;

    const defaultFee =
      typeof body.defaultPlatformFeePercent === 'number'
        ? body.defaultPlatformFeePercent
        : parseFloat(body.defaultPlatformFeePercent) || 15;

    const defaultDiscount =
      typeof body.defaultDiscountPercent === 'number'
        ? body.defaultDiscountPercent
        : body.defaultDiscountPercent !== undefined &&
          body.defaultDiscountPercent !== null &&
          body.defaultDiscountPercent !== ''
        ? parseFloat(body.defaultDiscountPercent) || 0
        : 0;

    const sanitizedRule = {
      shopName: body.shopName || 'My Etsy Shop',
      minProfitMargin: minMargin,
      minProfitAmountUSD: minProfitUsd,
      defaultPlatformFeePercent: defaultFee,
      defaultDiscountPercent: defaultDiscount,
    };

    inMemoryRules = { ...inMemoryRules, ...sanitizedRule };

    try {
      const db = await connectToDatabase();
      if (db) {
        const updated = await RuleModel.findOneAndUpdate(
          {},
          { $set: sanitizedRule },
          { upsert: true, new: true, lean: true, strict: false }
        );

        const merged = {
          ...sanitizedRule,
          ...(updated || {}),
          defaultDiscountPercent: defaultDiscount,
        };

        return NextResponse.json({ success: true, data: merged });
      }
    } catch (err) {
      console.warn('MongoDB update for rules failed:', err);
    }

    return NextResponse.json({ success: true, data: inMemoryRules });
  } catch (error) {
    console.error('Rules save error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
