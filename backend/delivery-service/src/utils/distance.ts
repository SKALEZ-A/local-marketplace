export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371;
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * 
    Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateDeliveryFee = (distance: number): number => {
  const baseFee = 5;
  const perKmFee = 1.5;
  
  if (distance <= 5) {
    return baseFee;
  }
  
  return baseFee + ((distance - 5) * perKmFee);
};

export const estimateDeliveryTime = (distance: number): number => {
  const averageSpeed = 40;
  const preparationTime = 15;
  
  const travelTime = (distance / averageSpeed) * 60;
  return Math.ceil(preparationTime + travelTime);
};

export const findNearestDriver = (
  driverLocations: Array<{ id: string; location: Coordinates }>,
  pickupLocation: Coordinates
): string | null => {
  if (driverLocations.length === 0) return null;
  
  let nearestDriver = driverLocations[0];
  let minDistance = calculateDistance(pickupLocation, nearestDriver.location);
  
  for (const driver of driverLocations) {
    const distance = calculateDistance(pickupLocation, driver.location);
    if (distance < minDistance) {
      minDistance = distance;
      nearestDriver = driver;
    }
  }
  
  return nearestDriver.id;
};
