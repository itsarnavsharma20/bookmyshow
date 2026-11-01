import type { Cinema } from './cinema.types.ts';

// Made-up cinema names. Ids are fixed so shows can point at a cinema. cityId matches city.seed.ts.
export const CINEMA_SEED: readonly Cinema[] = [
  { id: 'cinema-mum-juhu', cityId: 'city-mumbai', name: 'Starlight Cinemas Juhu', address: 'Juhu Tara Road, Mumbai', screens: 5 },
  { id: 'cinema-mum-andheri', cityId: 'city-mumbai', name: 'Metro Plex Andheri', address: 'Andheri West, Mumbai', screens: 7 },
  { id: 'cinema-del-saket', cityId: 'city-delhi', name: 'Starlight Cinemas Saket', address: 'Saket District Centre, Delhi', screens: 6 },
  { id: 'cinema-del-rajouri', cityId: 'city-delhi', name: 'Capital Screens Rajouri Garden', address: 'Rajouri Garden, Delhi', screens: 4 },
  { id: 'cinema-blr-koramangala', cityId: 'city-bengaluru', name: 'Starlight Cinemas Koramangala', address: '80 Feet Road, Koramangala, Bengaluru', screens: 5 },
  { id: 'cinema-blr-whitefield', cityId: 'city-bengaluru', name: 'Garden City Plex Whitefield', address: 'ITPL Main Road, Whitefield, Bengaluru', screens: 8 },
  { id: 'cinema-hyd-banjara', cityId: 'city-hyderabad', name: 'Starlight Cinemas Banjara Hills', address: 'Road No 12, Banjara Hills, Hyderabad', screens: 4 },
  { id: 'cinema-che-anna', cityId: 'city-chennai', name: 'Marina Screens Anna Nagar', address: '2nd Avenue, Anna Nagar, Chennai', screens: 5 },
  { id: 'cinema-kol-saltlake', cityId: 'city-kolkata', name: 'Starlight Cinemas Salt Lake', address: 'Sector V, Salt Lake, Kolkata', screens: 6 },
  { id: 'cinema-pun-koregaon', cityId: 'city-pune', name: 'Metro Plex Koregaon Park', address: 'North Main Road, Koregaon Park, Pune', screens: 4 },
  { id: 'cinema-ahm-satellite', cityId: 'city-ahmedabad', name: 'Starlight Cinemas Satellite', address: 'Satellite Road, Ahmedabad', screens: 5 },
];
