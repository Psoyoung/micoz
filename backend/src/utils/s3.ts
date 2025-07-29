import AWS from 'aws-sdk';
import multer from 'multer';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

export const uploadToS3 = async (file: Express.Multer.File, key: string): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    throw new Error(`Failed to delete file from S3: ${error}`);
  }
};

export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `uploads/${userId}/${timestamp}.${extension}`;
};

export const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});