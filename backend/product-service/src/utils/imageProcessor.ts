import sharp from 'sharp';
import logger from './logger';

interface ProcessedImages {
  original: Buffer;
  thumbnail: Buffer;
  small: Buffer;
  medium: Buffer;
  large: Buffer;
}

export const processImage = async (buffer: Buffer): Promise<ProcessedImages> => {
  try {
    // Original (compressed)
    const original = await sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Thumbnail (150x150)
    const thumbnail = await sharp(buffer)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Small (300x300)
    const small = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Medium (600x600)
    const medium = await sharp(buffer)
      .resize(600, 600, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Large (1200x1200)
    const large = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();

    logger.info('Image processed successfully');

    return { original, thumbnail, small, medium, large };
  } catch (error) {
    logger.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};

export const optimizeImage = async (buffer: Buffer, maxSizeKB: number = 500): Promise<Buffer> => {
  try {
    let quality = 90;
    let optimized = buffer;

    while (optimized.length > maxSizeKB * 1024 && quality > 20) {
      optimized = await sharp(buffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();
      
      quality -= 10;
    }

    logger.info(`Image optimized to ${(optimized.length / 1024).toFixed(2)}KB`);
    return optimized;
  } catch (error) {
    logger.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

export const generateThumbnail = async (buffer: Buffer, width: number = 150, height: number = 150): Promise<Buffer> => {
  try {
    return await sharp(buffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

export const convertToWebP = async (buffer: Buffer): Promise<Buffer> => {
  try {
    return await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();
  } catch (error) {
    logger.error('WebP conversion error:', error);
    throw new Error('Failed to convert to WebP');
  }
};

export const addWatermark = async (imageBuffer: Buffer, watermarkBuffer: Buffer): Promise<Buffer> => {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const watermark = await sharp(watermarkBuffer)
      .resize(Math.floor(metadata.width! * 0.2))
      .toBuffer();

    return await image
      .composite([
        {
          input: watermark,
          gravity: 'southeast'
        }
      ])
      .toBuffer();
  } catch (error) {
    logger.error('Watermark error:', error);
    throw new Error('Failed to add watermark');
  }
};
