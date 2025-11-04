import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export const processImage = async (
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<Buffer> => {
  const {
    width = 800,
    height,
    quality = 80,
    format = 'jpeg',
    fit = 'cover'
  } = options;

  let image = sharp(buffer);

  if (width || height) {
    image = image.resize(width, height, { fit });
  }

  switch (format) {
    case 'jpeg':
      image = image.jpeg({ quality });
      break;
    case 'png':
      image = image.png({ quality });
      break;
    case 'webp':
      image = image.webp({ quality });
      break;
  }

  return await image.toBuffer();
};

export const generateThumbnail = async (buffer: Buffer): Promise<Buffer> => {
  return await processImage(buffer, {
    width: 200,
    height: 200,
    quality: 70,
    fit: 'cover'
  });
};

export const generateImageVariants = async (buffer: Buffer) => {
  const variants = {
    thumbnail: await processImage(buffer, { width: 200, height: 200 }),
    small: await processImage(buffer, { width: 400, height: 400 }),
    medium: await processImage(buffer, { width: 800, height: 800 }),
    large: await processImage(buffer, { width: 1200, height: 1200 })
  };

  return variants;
};

export const getImageMetadata = async (buffer: Buffer) => {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha
  };
};

export const optimizeImage = async (buffer: Buffer): Promise<Buffer> => {
  return await sharp(buffer)
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
};
