export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const calculateDiscount = (originalPrice: number, discountPercent: number): number => {
  return originalPrice * (1 - discountPercent / 100);
};

export const calculateDiscountPercent = (originalPrice: number, discountedPrice: number): number => {
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100);
};

export const calculateTotal = (subtotal: number, taxRate: number, shippingCost: number = 0): number => {
  const tax = calculateTax(subtotal, taxRate);
  return subtotal + tax + shippingCost;
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // Placeholder for currency conversion
  // In production, integrate with a currency conversion API
  const exchangeRates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25
  };

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  return (amount / fromRate) * toRate;
};
