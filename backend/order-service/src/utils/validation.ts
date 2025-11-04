export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateAddress = (address: any): { valid: boolean; errors: string[] } => {
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

export const validateOrderData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (!data.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const addressValidation = validateAddress(data.shippingAddress);
    if (!addressValidation.valid) {
      errors.push(...addressValidation.errors);
    }
  }

  if (data.billingAddress) {
    const addressValidation = validateAddress(data.billingAddress);
    if (!addressValidation.valid) {
      errors.push(...addressValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
