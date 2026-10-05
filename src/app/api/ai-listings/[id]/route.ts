import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AiListingModel } from '@/models/AiListing';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const item = await AiListingModel.findById(id).lean();
    if (!item) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching AI listing:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
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
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const updated = await AiListingModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title: (body.title || body.concept || 'Untitled Etsy Listing').trim(),
          concept: body.concept || '',
          material: body.material || '',
          tags: Array.isArray(body.tags) ? body.tags : [],
          alternativeTitles: Array.isArray(body.alternativeTitles) ? body.alternativeTitles : [],
          metaDescription: body.metaDescription || '',
          bulletPoints: Array.isArray(body.bulletPoints) ? body.bulletPoints : [],
          fullDescription: body.fullDescription || '',
          personalizationInstructions: body.personalizationInstructions || '',
        },
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating AI listing:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const deleted = await AiListingModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'AI listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI listing:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
