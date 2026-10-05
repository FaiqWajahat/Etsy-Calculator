import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials exist
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  message?: string;
  isSimulated?: boolean;
}

/**
 * Uploads an invoice slip image / snapshot to Cloudinary.
 * If credentials are not present, generates a temporary simulated URL or data link.
 */
export async function uploadSlipToCloudinary(
  base64Image: string,
  folder = 'etsy_calculator_slips'
): Promise<CloudinaryUploadResult> {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!isConfigured) {
    return {
      success: true,
      url: base64Image,
      message: 'Cloudinary credentials not detected in .env.local — using direct local preview URL.',
      isSimulated: true,
    };
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const uploadRes = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'image',
      format: 'png',
    });

    return {
      success: true,
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
    };
  } catch (error: unknown) {
    console.error('Cloudinary upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return {
      success: false,
      url: base64Image,
      message: errorMessage,
      isSimulated: true,
    };
  }
}
