import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ListingModel } from '@/models/Listing';

// In-memory fallback if local MongoDB is not yet running
const inMemoryListings: Array<Record<string, unknown>> = [];

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const listings = await ListingModel.find({}).sort({ updatedAt: -1 }).limit(100).lean();

      // Also merge any standalone AI listings that may have been created
      try {
        const { AiListingModel } = await import('@/models/AiListing');
        const aiListings = await AiListingModel.find({}).sort({ updatedAt: -1 }).limit(100).lean();

        const existingIds = new Set(listings.map((l) => String(l._id)));
        const existingTitles = new Set(
          listings.map((l) => (l.title || '').trim().toLowerCase()).filter(Boolean)
        );

        for (const ai of aiListings) {
          const aiIdStr = String(ai._id);
          const aiTitleNorm = (ai.title || ai.concept || '').trim().toLowerCase();

          if (!existingIds.has(aiIdStr) && (!aiTitleNorm || !existingTitles.has(aiTitleNorm))) {
            listings.push({
              _id: ai._id,
              title: ai.title || ai.concept || 'Untitled Etsy Listing',
              material: ai.material || '',
              listingTags: ai.tags || [],
              fullDescription: ai.fullDescription || '',
              personalizationInstructions: ai.personalizationInstructions || '',
              alternativeTitles: ai.alternativeTitles || [],
              metaDescription: ai.metaDescription || '',
              bulletPoints: ai.bulletPoints || [],
              listingType: 'physical',
              inputs: {
                salePrice: 0,
                itemCost: 0,
                costCurrency: 'PKR',
                listingCurrency: 'USD',
                shippingChargedToCustomer: 0,
                shippingActualCost: 0,
                packagingCost: 0,
                laborHours: 0,
                laborRatePerHour: 0,
                sellerCountry: 'PK',
                offsiteAdsPercent: 0,
                etsyAdsCostPerSale: 0,
                discountPercent: 0,
                renewalsCount: 1,
                listingType: 'physical',
              },
              results: {
                grossRevenueListingCurr: 0,
                netProfitListingCurr: 0,
                netProfitLocalCurr: 0,
                profitMarginPercent: 0,
                breakEvenPriceListingCurr: 0,
                effectiveExchangeRate: 1,
                fees: {
                  listingFeeListingCurr: 0,
                  transactionFeeListingCurr: 0,
                  paymentProcessingFeeListingCurr: 0,
                  regulatoryOperatingFeeListingCurr: 0,
                  offsiteAdsFeeListingCurr: 0,
                  etsyAdsFeeListingCurr: 0,
                  totalEtsyFeesListingCurr: 0,
                  totalFeesPercent: 0,
                },
              },
              createdAt: ai.createdAt,
              updatedAt: ai.updatedAt,
            } as any);
            existingIds.add(aiIdStr);
            if (aiTitleNorm) existingTitles.add(aiTitleNorm);
          }
        }
      } catch (aiErr) {
        console.warn('Could not merge AI listings:', aiErr);
      }

      return NextResponse.json({ success: true, data: listings, source: 'mongodb' });
    }
  } catch (err) {
    console.warn('MongoDB query failed, falling back to memory storage:', err);
  }

  return NextResponse.json({ success: true, data: inMemoryListings, source: 'in-memory' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      sku,
      category,
      listingType,
      inputs,
      results,
      listingTags,
      notes,
      cloudinarySlipUrl,
      material,
      fullDescription,
      personalizationInstructions,
      alternativeTitles,
      metaDescription,
      bulletPoints,
    } = body;

    const safeInputs = inputs || {};
    const safeResults = results || {};

    try {
      const db = await connectToDatabase();
      if (db) {
        const newListing = await ListingModel.create({
          title: title || 'Untitled Etsy Listing',
          sku: sku || '',
          category: category || 'General',
          listingType: listingType || 'physical',
          inputs: safeInputs,
          studioPricing: body.studioPricing || null,
          results: safeResults,
          listingTags: listingTags || [],
          notes: notes || '',
          cloudinarySlipUrl: cloudinarySlipUrl || '',
          material: material || '',
          fullDescription: fullDescription || '',
          personalizationInstructions: personalizationInstructions || '',
          alternativeTitles: alternativeTitles || [],
          metaDescription: metaDescription || '',
          bulletPoints: bulletPoints || [],
        });

        return NextResponse.json({ success: true, data: newListing, source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('MongoDB save failed, saving to local in-memory store:', dbErr);
    }

    // Fallback in-memory save
    const fallbackItem = {
      _id: 'local_' + Date.now(),
      title: title || 'Untitled Etsy Listing',
      sku: sku || '',
      category: category || 'General',
      listingType: listingType || 'physical',
      inputs,
      studioPricing: body.studioPricing || null,
      results,
      listingTags: listingTags || [],
      notes: notes || '',
      cloudinarySlipUrl: cloudinarySlipUrl || '',
      material: material || '',
      fullDescription: fullDescription || '',
      personalizationInstructions: personalizationInstructions || '',
      alternativeTitles: alternativeTitles || [],
      metaDescription: metaDescription || '',
      bulletPoints: bulletPoints || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryListings.unshift(fallbackItem);

    return NextResponse.json({ success: true, data: fallbackItem, source: 'in-memory' });
  } catch (error) {
    console.error('Save listing error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
