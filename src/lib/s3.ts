import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";
const bucket = process.env.S3_BUCKET || "";

const s3 = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});

export async function getPresignedUploadUrl(key: string, contentType = "application/octet-stream") {
  if (!bucket) throw new Error("S3_BUCKET is not configured");
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ACL: "private" });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
  return url;
}

export default s3;
