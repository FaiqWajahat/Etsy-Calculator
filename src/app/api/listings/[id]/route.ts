import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ListingModel } from '@/models/Listing';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = await connectToDatabase();

    if (db && !id.startsWith('local_')) {
      const updated = await ListingModel.findByIdAndUpdate(
        id,
        {
          title: body.title,
          listingType: body.listingType || 'physical',
          inputs: body.inputs,
          studioPricing: body.studioPricing,
          results: body.results,
          listingTags: body.listingTags || [],
          sku: body.sku || '',
          category: body.category || 'General',
          notes: body.notes || '',
          material: body.material || '',
          fullDescription: body.fullDescription || '',
          personalizationInstructions: body.personalizationInstructions || '',
          alternativeTitles: body.alternativeTitles || [],
          metaDescription: body.metaDescription || '',
          bulletPoints: body.bulletPoints || [],
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Listing not found in database' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Listing updated successfully',
      });
    }

    // Fallback response for local-only IDs
    return NextResponse.json({
      success: true,
      data: { ...body, _id: id, id },
      message: 'Updated locally',
    });
  } catch (error) {
    console.error('Update error in /api/listings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Could not update listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (db && !id.startsWith('local_')) {
      await ListingModel.findByIdAndDelete(id);
      try {
        const { AiListingModel } = await import('@/models/AiListing');
        await AiListingModel.findByIdAndDelete(id);
      } catch (e) {
        // ignore
      }
    }
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error in /api/listings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Could not delete listing' },
      { status: 500 }
    );
  }
}
