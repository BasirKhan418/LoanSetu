import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

// 🔹 POST = generate signed URL(s)
// - Non-multipart: simple single PUT URL
// - Multipart: Create multipart upload + signed URLs per part
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      filename,
      contentType,
      multipart = false,
      partCount = 1, // number of parts client wants to upload
    } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const uniqueFilename = `${Date.now()}-${filename}`;

    // ✅ Simple single-part upload (your existing behavior)
    if (!multipart) {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: uniqueFilename,
        ContentType: contentType,
      });

      const uploadURL = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
      const fileURL = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${uniqueFilename}`;

      return NextResponse.json({
        success: true,
        data: {
          type: "single",
          uploadURL,
          fileURL,
          filename: uniqueFilename,
        },
      });
    }

    // ✅ Multipart upload flow (INIT + part URLs)
    // 1) Initiate multipart upload
    const createCmd = new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    const createRes = await s3Client.send(createCmd);

    if (!createRes.UploadId) {
      throw new Error("Failed to create multipart upload");
    }

    const uploadId = createRes.UploadId;

    // 2) Generate presigned URLs for each part
    const parts = await Promise.all(
      Array.from({ length: partCount }, async (_, index) => {
        const partNumber = index + 1;
        const uploadPartCmd = new UploadPartCommand({
          Bucket: BUCKET,
          Key: uniqueFilename,
          PartNumber: partNumber,
          UploadId: uploadId,
          //@ts-ignore
          ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3Client, uploadPartCmd, {
          expiresIn: 3600,
        });

        return {
          partNumber,
          uploadURL: signedUrl,
        };
      })
    );

    const fileURL = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        type: "multipart",
        uploadId,
        key: uniqueFilename,
        fileURL,
        parts, // array of { partNumber, uploadURL }
      },
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate upload URL(s)",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 🔹 PUT = complete multipart upload
// Body: { key, uploadId, parts: [{ ETag, PartNumber }] }
export async function PUT(request: NextRequest) {
  try {
    const { key, uploadId, parts } = await request.json();

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "key, uploadId and parts (array of { ETag, PartNumber }) are required",
        },
        { status: 400 }
      );
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p: any) => ({
          ETag: p.ETag,
          PartNumber: p.PartNumber,
        })),
      },
    });

    await s3Client.send(command);

    const fileURL = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      data: {
        fileURL,
        key,
      },
    });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete multipart upload",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
