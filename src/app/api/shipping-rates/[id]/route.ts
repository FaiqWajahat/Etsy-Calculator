import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShippingRateModel } from '@/models/ShippingRate';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (db) {
      const rate = await ShippingRateModel.findById(id).lean();
      if (!rate) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: rate });
    }
    return NextResponse.json({ success: false, error: 'DB unavailable' }, { status: 503 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Could not fetch' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = await connectToDatabase();
    if (db) {
      const updated = await ShippingRateModel.findByIdAndUpdate(
        id,
        {
          courier: (body.courier || '').trim(),
          zoneLabel: (body.zoneLabel || '').trim(),
          countries: Array.isArray(body.countries) ? body.countries : [],
          weightSlabs: Array.isArray(body.weightSlabs) ? body.weightSlabs : [],
          currency: body.currency || 'PKR',
          fuelSurchargePercent: Number(body.fuelSurchargePercent) || 0,
          notes: body.notes || '',
          isActive: body.isActive !== false,
        },
        { new: true }
      );
      if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }
    return NextResponse.json({ success: false, error: 'DB unavailable' }, { status: 503 });
  } catch (err) {
    console.error('PUT /api/shipping-rates/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Could not update' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (db) {
      await ShippingRateModel.findByIdAndDelete(id);
    }
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/shipping-rates/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Could not delete' }, { status: 500 });
  }
}
