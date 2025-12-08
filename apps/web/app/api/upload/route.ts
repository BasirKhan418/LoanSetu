import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { cookies } from 'next/headers';
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    
    // If token exists, validate it (allow all user types: user, admin, employee)
  
    // If no token, allow upload (for employee signup process)
    
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    // Add timestamp to filename to avoid conflicts
    const uniqueFilename = `${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileURL = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;

    return NextResponse.json({ 
      success: true,
      data: {
        uploadURL, 
        fileURL,
        filename: uniqueFilename
      }
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate upload URL', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}