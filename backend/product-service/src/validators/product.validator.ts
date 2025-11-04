import Joi from 'joi';

export const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description must not exceed 5000 characters',
    'any.required': 'Description is required'
  }),
  price: Joi.number().min(0.01).max(1000000).required().messages({
    'number.min': 'Price must be at least 0.01',
    'number.max': 'Price must not exceed 1,000,000',
    'any.required': 'Price is required'
  }),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD').default('USD'),
  category: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    path: Joi.string().required()
  }).required(),
  attributes: Joi.object({
    brand: Joi.string().optional(),
    color: Joi.string().optional(),
    size: Joi.string().optional(),
    weight: Joi.number().optional(),
    dimensions: Joi.object({
      length: Joi.number().required(),
      width: Joi.number().required(),
      height: Joi.number().required()
    }).optional()
  }).optional(),
  variants: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      sku: Joi.string().required()
    })
  ).optional(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).required(),
  seo: Joi.object({
    slug: Joi.string().optional(),
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    keywords: Joi.array().items(Joi.string()).optional()
  }).optional(),
  arEnabled: Joi.boolean().default(false),
  arModelUrl: Joi.string().uri().optional()
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  price: Joi.number().min(0.01).max(1000000).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD').optional(),
  category: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    path: Joi.string().required()
  }).optional(),
  attributes: Joi.object({
    brand: Joi.string().optional(),
    color: Joi.string().optional(),
    size: Joi.string().optional(),
    weight: Joi.number().optional(),
    dimensions: Joi.object({
      length: Joi.number().required(),
      width: Joi.number().required(),
      height: Joi.number().required()
    }).optional()
  }).optional(),
  variants: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      sku: Joi.string().required()
    })
  ).optional(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).optional(),
  seo: Joi.object({
    slug: Joi.string().optional(),
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    keywords: Joi.array().items(Joi.string()).optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'out_of_stock').optional(),
  arEnabled: Joi.boolean().optional(),
  arModelUrl: Joi.string().uri().optional()
}).min(1);

export const bulkUploadSchema = Joi.object({
  products: Joi.array().items(createProductSchema).min(1).max(1000).required().messages({
    'array.min': 'At least one product is required',
    'array.max': 'Maximum 1000 products per batch',
    'any.required': 'Products array is required'
  })
});
