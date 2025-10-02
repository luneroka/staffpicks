import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/app/lib/auth/helpers';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/image
 * Upload an image to Cloudinary (supports both file upload and URL)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Parse the request
    const contentType = request.headers.get('content-type') || '';

    let uploadSource: string | File;
    let uploadType: 'file' | 'url';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      uploadSource = file;
      uploadType = 'file';
    } else {
      // Handle URL upload
      const body = await request.json();
      const { url } = body;

      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }

      uploadSource = url;
      uploadType = 'url';
    }

    // 3. Upload to Cloudinary
    let cloudinaryResult;

    if (uploadType === 'file') {
      // Convert file to base64 for Cloudinary upload
      const file = uploadSource as File;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      cloudinaryResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'staffpicks/book-covers',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 700, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
    } else {
      // Upload from URL
      const url = uploadSource as string;

      cloudinaryResult = await cloudinary.uploader.upload(url, {
        folder: 'staffpicks/book-covers',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 700, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
    }

    // 4. Return the Cloudinary URL
    return NextResponse.json({
      success: true,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to upload image', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
