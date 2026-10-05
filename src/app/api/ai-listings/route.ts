import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AiListingModel } from '@/models/AiListing';

// In-memory fallback if MongoDB Atlas is momentarily unreachable
const inMemoryAiListings: Array<Record<string, unknown>> = [];

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const items = await AiListingModel.find({}).sort({ updatedAt: -1 }).limit(100).lean();
      return NextResponse.json({ success: true, data: items, source: 'mongodb' });
    }
  } catch (err) {
    console.warn('MongoDB query for AI listings failed, using in-memory store:', err);
  }

  return NextResponse.json({ success: true, data: inMemoryAiListings, source: 'in-memory' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      concept,
      material,
      tags,
      alternativeTitles,
      metaDescription,
      bulletPoints,
      fullDescription,
      personalizationInstructions,
    } = body;

    const safeTitle = (title || concept || 'Untitled Etsy Listing').trim();

    try {
      const db = await connectToDatabase();
      if (db) {
        const newDoc = await AiListingModel.create({
          title: safeTitle,
          concept: concept || safeTitle,
          material: material || '',
          tags: Array.isArray(tags) ? tags : [],
          alternativeTitles: Array.isArray(alternativeTitles) ? alternativeTitles : [],
          metaDescription: metaDescription || '',
          bulletPoints: Array.isArray(bulletPoints) ? bulletPoints : [],
          fullDescription: fullDescription || '',
          personalizationInstructions: personalizationInstructions || '',
        });

        return NextResponse.json({ success: true, data: newDoc, source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('MongoDB save for AI listing failed, saving to in-memory store:', dbErr);
    }

    // In-memory fallback
    const fallbackItem = {
      _id: 'local_ai_' + Date.now(),
      title: safeTitle,
      concept: concept || safeTitle,
      material: material || '',
      tags: Array.isArray(tags) ? tags : [],
      alternativeTitles: Array.isArray(alternativeTitles) ? alternativeTitles : [],
      metaDescription: metaDescription || '',
      bulletPoints: Array.isArray(bulletPoints) ? bulletPoints : [],
      fullDescription: fullDescription || '',
      personalizationInstructions: personalizationInstructions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryAiListings.unshift(fallbackItem);

    return NextResponse.json({ success: true, data: fallbackItem, source: 'in-memory' });
  } catch (error) {
    console.error('Error saving AI listing:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
