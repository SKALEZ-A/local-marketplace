import { Request, Response, NextFunction } from 'express';
import Product from '../models/product.model';
import { uploadToS3, deleteFromS3 } from '../utils/s3';
import { processImage } from '../utils/imageProcessor';
import { publishEvent } from '../config/rabbitmq';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';
import { AppError } from '../utils/appError';
import { generateSlug } from '../utils/helpers';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productData = req.body;
    const sellerId = req.user?.userId;

    // Generate SEO slug
    if (!productData.seo?.slug) {
      productData.seo = {
        ...productData.seo,
        slug: generateSlug(productData.title)
      };
    }

    // Set seller info
    productData.seller = {
      id: sellerId,
      name: req.user?.name || 'Unknown Seller',
      rating: 0
    };

    // Create product
    const product = await Product.create(productData);

    // Publish event for search indexing
    await publishEvent('product.created', {
      productId: product._id,
      title: product.title,
      category: product.category,
      price: product.price,
      location: product.location
    });

    // Invalidate cache
    await redisClient.del(`products:seller:${sellerId}`);

    logger.info(`Product created: ${product._id}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      location,
      radius = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { status: 'active' };

    if (category) {
      query['category.id'] = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // Location-based search
    if (location) {
      const [lng, lat] = (location as string).split(',').map(parseFloat);
      const radiusMiles = parseFloat(radius as string);
      const radiusMeters = radiusMiles * 1609.34;

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusMeters
        }
      };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await redisClient.get(`product:${id}`);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: { product: JSON.parse(cached) }
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Increment views
    product.views += 1;
    await product.save();

    // Cache product
    await redisClient.setEx(`product:${id}`, 3600, JSON.stringify(product));

    // Track view event
    await publishEvent('product.viewed', {
      productId: product._id,
      sellerId: product.seller.id,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const sellerId = req.user?.userId;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check ownership
    if (product.seller.id !== sellerId) {
      throw new AppError('Unauthorized to update this product', 403);
    }

    // Update product
    Object.assign(product, updates);
    await product.save();

    // Invalidate cache
    await redisClient.del(`product:${id}`);
    await redisClient.del(`products:seller:${sellerId}`);

    // Publish update event
    await publishEvent('product.updated', {
      productId: product._id,
      updates: Object.keys(updates)
    });

    logger.info(`Product updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?.userId;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check ownership
    if (product.seller.id !== sellerId) {
      throw new AppError('Unauthorized to delete this product', 403);
    }

    // Soft delete
    product.status = 'inactive';
    await product.save();

    // Delete images from S3
    for (const image of product.images) {
      await deleteFromS3(image.url);
    }

    // Invalidate cache
    await redisClient.del(`product:${id}`);
    await redisClient.del(`products:seller:${sellerId}`);

    // Publish delete event
    await publishEvent('product.deleted', {
      productId: product._id,
      sellerId: product.seller.id
    });

    logger.info(`Product deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError('No images provided', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check ownership
    if (product.seller.id !== req.user?.userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Process and upload images
    const imagePromises = files.map(async (file) => {
      // Process image
      const { original, thumbnail } = await processImage(file.buffer);

      // Upload to S3
      const originalUrl = await uploadToS3(original, `products/${id}/${Date.now()}-original.jpg`);
      const thumbnailUrl = await uploadToS3(thumbnail, `products/${id}/${Date.now()}-thumb.jpg`);

      return {
        url: originalUrl,
        thumbnail: thumbnailUrl,
        alt: file.originalname
      };
    });

    const images = await Promise.all(imagePromises);

    // Add images to product
    product.images.push(...images);
    await product.save();

    // Invalidate cache
    await redisClient.del(`product:${id}`);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: { images }
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user?.userId;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { 'seller.id': sellerId };
    if (status) {
      query.status = status;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = req.body.products;
    const sellerId = req.user?.userId;

    if (!Array.isArray(products) || products.length === 0) {
      throw new AppError('No products provided', 400);
    }

    if (products.length > 1000) {
      throw new AppError('Maximum 1000 products per batch', 400);
    }

    // Add seller info to all products
    const productsWithSeller = products.map(p => ({
      ...p,
      seller: {
        id: sellerId,
        name: req.user?.name || 'Unknown Seller',
        rating: 0
      },
      seo: {
        ...p.seo,
        slug: p.seo?.slug || generateSlug(p.title)
      }
    }));

    // Bulk insert
    const result = await Product.insertMany(productsWithSeller, { ordered: false });

    // Publish events
    await publishEvent('products.bulk_created', {
      sellerId,
      count: result.length,
      productIds: result.map(p => p._id)
    });

    logger.info(`Bulk upload: ${result.length} products created`);

    res.status(201).json({
      success: true,
      message: `${result.length} products created successfully`,
      data: { count: result.length }
    });
  } catch (error) {
    next(error);
  }
};
