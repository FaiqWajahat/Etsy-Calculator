import { NextRequest, NextResponse } from 'next/server';
import { uploadSlipToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      );
    }

    const result = await uploadSlipToCloudinary(imageBase64);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cloudinary API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
