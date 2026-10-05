import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShippingRateModel } from '@/models/ShippingRate';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const rates = await ShippingRateModel.find({}).sort({ courier: 1, zoneLabel: 1 }).lean();
      return NextResponse.json({ success: true, data: rates });
    }
  } catch (err) {
    console.warn('Could not fetch shipping rates:', err);
  }
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await connectToDatabase();
    if (db) {
      const doc = await ShippingRateModel.create({
        courier: (body.courier || 'DHL Express').trim(),
        zoneLabel: (body.zoneLabel || 'Zone').trim(),
        countries: Array.isArray(body.countries) ? body.countries : [],
        weightSlabs: Array.isArray(body.weightSlabs) ? body.weightSlabs : [],
        currency: body.currency || 'PKR',
        fuelSurchargePercent: Number(body.fuelSurchargePercent) || 0,
        notes: body.notes || '',
        isActive: body.isActive !== false,
      });
      return NextResponse.json({ success: true, data: doc });
    }
    return NextResponse.json({ success: false, error: 'DB unavailable' }, { status: 503 });
  } catch (err) {
    console.error('POST /api/shipping-rates error:', err);
    return NextResponse.json({ success: false, error: 'Could not save rate card' }, { status: 500 });
  }
}
