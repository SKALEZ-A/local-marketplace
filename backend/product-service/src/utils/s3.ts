import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'marketplace-products';

export const uploadToS3 = async (buffer: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> => {
  try {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'max-age=31536000'
    };

    const result = await s3.upload(params).promise();
    logger.info(`File uploaded to S3: ${result.Location}`);
    return result.Location;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (url: string): Promise<void> => {
  try {
    const key = url.split('.com/')[1];
    
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    logger.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

export const uploadMultipleToS3 = async (files: Array<{ buffer: Buffer; key: string; contentType?: string }>): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file =>
      uploadToS3(file.buffer, file.key, file.contentType)
    );

    const urls = await Promise.all(uploadPromises);
    logger.info(`${urls.length} files uploaded to S3`);
    return urls;
  } catch (error) {
    logger.error('S3 multiple upload error:', error);
    throw new Error('Failed to upload multiple files to S3');
  }
};

export const copyS3Object = async (sourceKey: string, destinationKey: string): Promise<string> => {
  try {
    const params: AWS.S3.CopyObjectRequest = {
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
      ACL: 'public-read'
    };

    await s3.copyObject(params).promise();
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${destinationKey}`;
    logger.info(`File copied in S3: ${url}`);
    return url;
  } catch (error) {
    logger.error('S3 copy error:', error);
    throw new Error('Failed to copy file in S3');
  }
};

export const listS3Objects = async (prefix: string): Promise<string[]> => {
  try {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: BUCKET_NAME,
      Prefix: prefix
    };

    const result = await s3.listObjectsV2(params).promise();
    const keys = result.Contents?.map(obj => obj.Key!) || [];
    return keys;
  } catch (error) {
    logger.error('S3 list error:', error);
    throw new Error('Failed to list S3 objects');
  }
};
