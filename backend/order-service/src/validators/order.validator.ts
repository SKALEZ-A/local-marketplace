import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        variantId: Joi.string(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
        name: Joi.string().required(),
        sku: Joi.string().required(),
        image: Joi.string().uri(),
        attributes: Joi.object()
      })
    )
    .min(1)
    .required(),
  
  shippingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    street: Joi.string().required(),
    apartment: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }).required(),
  
  billingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    street: Joi.string().required(),
    apartment: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().required()
  }).required(),
  
  shippingMethod: Joi.string()
    .valid('standard', 'express', 'overnight', 'free')
    .required(),
  
  paymentMethod: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'stripe', 'crypto')
    .required(),
  
  paymentDetails: Joi.object({
    token: Joi.string(),
    last4: Joi.string(),
    brand: Joi.string()
  }),
  
  couponCode: Joi.string(),
  
  notes: Joi.string().max(500),
  
  metadata: Joi.object()
});

export const updateOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string(),
    street: Joi.string(),
    apartment: Joi.string().allow(''),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    postalCode: Joi.string()
  }),
  
  notes: Joi.string().max(500),
  
  metadata: Joi.object()
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().required().min(10).max(500),
  refundRequested: Joi.boolean().default(true)
});

export const refundRequestSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  reason: Joi.string().required().min(10).max(500),
  items: Joi.array().items(Joi.string()),
  type: Joi.string().valid('full', 'partial').default('full')
});

export const orderQuerySchema = Joi.object({
  status: Joi.string().valid(
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED'
  ),
  paymentStatus: Joi.string().valid(
    'PENDING',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
  ),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  minAmount: Joi.number().min(0),
  maxAmount: Joi.number().min(Joi.ref('minAmount')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'total', 'status').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required(),
  note: Joi.string().max(500)
});

export const shipOrderSchema = Joi.object({
  trackingNumber: Joi.string().required(),
  carrier: Joi.string().required(),
  estimatedDelivery: Joi.date().iso().min('now'),
  shippingLabel: Joi.string().uri()
});

export const addItemToCartSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string(),
  quantity: Joi.number().integer().min(1).required(),
  customization: Joi.object()
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

export const applyCouponSchema = Joi.object({
  code: Joi.string().required().uppercase().trim()
});

export const submitReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().max(100),
  comment: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()).max(5),
  wouldRecommend: Joi.boolean()
});

export const orderAnalyticsSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
  metrics: Joi.array().items(
    Joi.string().valid('revenue', 'orders', 'averageOrderValue', 'items')
  )
});

export const bulkUpdateOrdersSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string()).min(1).max(100).required(),
  updates: Joi.object({
    status: Joi.string().valid(
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED'
    ),
    note: Joi.string().max(500)
  }).required()
});

export const exportOrdersSchema = Joi.object({
  format: Joi.string().valid('csv', 'xlsx', 'pdf').default('csv'),
  filters: orderQuerySchema,
  fields: Joi.array().items(Joi.string())
});

export const orderSearchSchema = Joi.object({
  query: Joi.string().required().min(1),
  searchIn: Joi.array()
    .items(Joi.string().valid('orderNumber', 'email', 'phone', 'name'))
    .default(['orderNumber', 'email']),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

export const validateOrderItem = (item: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!item.productId) {
    errors.push('Product ID is required');
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push('Valid quantity is required');
  }

  if (!item.price || item.price < 0) {
    errors.push('Valid price is required');
  }

  if (!item.name) {
    errors.push('Product name is required');
  }

  if (!item.sku) {
    errors.push('SKU is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateAddress = (address: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'street',
    'city',
    'state',
    'country',
    'postalCode'
  ];

  requiredFields.forEach(field => {
    if (!address[field]) {
      errors.push(`${field} is required`);
    }
  });

  if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    errors.push('Invalid email format');
  }

  if (address.phone && !/^\+?[1-9]\d{1,14}$/.test(address.phone.replace(/[\s-]/g, ''))) {
    errors.push('Invalid phone number format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateOrderTotal = (order: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const calculatedSubtotal = order.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  if (Math.abs(calculatedSubtotal - order.subtotal) > 0.01) {
    errors.push('Subtotal mismatch');
  }

  const calculatedTotal = order.subtotal - order.discount + order.tax + order.shippingCost;

  if (Math.abs(calculatedTotal - order.total) > 0.01) {
    errors.push('Total amount mismatch');
  }

  if (order.total < 0) {
    errors.push('Total amount cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
