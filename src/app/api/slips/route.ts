import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SlipModel } from '@/models/Slip';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const slips = await SlipModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
      return NextResponse.json({ success: true, data: slips });
    }
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('Fetch slips error:', error);
    return NextResponse.json({ success: false, error: 'Could not fetch slips' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      cloudinaryUrl,
      publicId,
      netSellingPriceUSD,
      originalPriceUSD,
      discountPercent,
      netProfitLocal,
      costCurrency,
      listingCurrency,
    } = body;

    if (!cloudinaryUrl) {
      return NextResponse.json({ success: false, error: 'Cloudinary URL is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      const newSlip = await SlipModel.create({
        title: title || 'Etsy Pricing Slip',
        cloudinaryUrl,
        publicId: publicId || '',
        netSellingPriceUSD: netSellingPriceUSD || 0,
        originalPriceUSD: originalPriceUSD || 0,
        discountPercent: discountPercent || 0,
        netProfitLocal: netProfitLocal || 0,
        costCurrency: costCurrency || 'PKR',
        listingCurrency: listingCurrency || 'USD',
      });

      return NextResponse.json({ success: true, data: newSlip });
    }

    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  } catch (error) {
    console.error('Save slip error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Slip ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      await SlipModel.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 });
  } catch (error) {
    console.error('Delete slip error:', error);
    return NextResponse.json({ success: false, error: 'Could not delete slip' }, { status: 500 });
  }
}
