export const generateTrackingNumber = (): string => {
  const prefix = 'TRK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const validateTrackingNumber = (trackingNumber: string): boolean => {
  return /^TRK[A-Z0-9]{10,}$/.test(trackingNumber);
};

export const parseTrackingNumber = (trackingNumber: string): { timestamp: number; random: string } | null => {
  if (!validateTrackingNumber(trackingNumber)) {
    return null;
  }

  try {
    const withoutPrefix = trackingNumber.substring(3);
    const timestampPart = withoutPrefix.substring(0, withoutPrefix.length - 6);
    const randomPart = withoutPrefix.substring(withoutPrefix.length - 6);
    
    const timestamp = parseInt(timestampPart, 36);
    
    return {
      timestamp,
      random: randomPart
    };
  } catch {
    return null;
  }
};

export const formatTrackingUrl = (trackingNumber: string, carrier: string): string => {
  const baseUrls: Record<string, string> = {
    'UPS': 'https://www.ups.com/track?tracknum=',
    'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
    'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
    'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB='
  };

  const baseUrl = baseUrls[carrier] || '#';
  return `${baseUrl}${trackingNumber}`;
};
