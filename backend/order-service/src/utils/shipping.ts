export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
}

export const calculateShippingCost = (
  weight: number,
  distance: number,
  carrier: string = 'standard'
): number => {
  const baseRates: Record<string, number> = {
    standard: 5,
    express: 15,
    overnight: 30
  };

  const baseRate = baseRates[carrier] || baseRates.standard;
  const weightCost = weight * 0.5;
  const distanceCost = distance * 0.1;

  return baseRate + weightCost + distanceCost;
};

export const estimateDeliveryDate = (
  carrier: string = 'standard',
  processingDays: number = 1
): Date => {
  const deliveryDays: Record<string, number> = {
    standard: 5,
    express: 2,
    overnight: 1
  };

  const totalDays = processingDays + (deliveryDays[carrier] || deliveryDays.standard);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + totalDays);

  return deliveryDate;
};

export const getAvailableShippingOptions = (
  weight: number,
  distance: number
): ShippingRate[] => {
  return [
    {
      carrier: 'standard',
      service: 'Standard Shipping',
      cost: calculateShippingCost(weight, distance, 'standard'),
      estimatedDays: 5
    },
    {
      carrier: 'express',
      service: 'Express Shipping',
      cost: calculateShippingCost(weight, distance, 'express'),
      estimatedDays: 2
    },
    {
      carrier: 'overnight',
      service: 'Overnight Shipping',
      cost: calculateShippingCost(weight, distance, 'overnight'),
      estimatedDays: 1
    }
  ];
};

export const validateShippingAddress = (address: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!address.street || address.street.trim().length === 0) {
    errors.push('Street address is required');
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (!address.zipCode || address.zipCode.trim().length === 0) {
    errors.push('Zip code is required');
  }

  if (!address.country || address.country.trim().length === 0) {
    errors.push('Country is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
