export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  // Mock Google Maps Geocoding API
  console.log(`[Geo] Geocoding address: ${address}`);
  
  // Return random coordinates around a generic center
  return {
    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
    lng: -74.0060 + (Math.random() - 0.5) * 0.1,
    formattedAddress: address.toUpperCase(),
  };
};

export const calculateDeliveryDistanceAndFee = async (origin: string, destination: string) => {
  // Mock Google Maps Distance Matrix API
  const distanceMiles = Math.round(Math.random() * 15 * 10) / 10 + 1; // 1 to 16 miles
  const baseFee = 3.99;
  const perMileFee = 1.50;
  
  const totalFee = baseFee + (distanceMiles * perMileFee);
  
  return {
    distanceMiles,
    deliveryFee: Math.round(totalFee * 100) / 100
  };
};
