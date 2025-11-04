export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

export const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TRK-${timestamp}-${random}`;
};

export const parseOrderNumber = (orderNumber: string) => {
  const parts = orderNumber.split('-');
  return {
    prefix: parts[0],
    timestamp: parts[1],
    random: parts[2]
  };
};

export const validateOrderNumber = (orderNumber: string): boolean => {
  const pattern = /^ORD-[A-Z0-9]+-[A-Z0-9]+$/;
  return pattern.test(orderNumber);
};
