import type { City } from './city.types.ts';

// Ids are fixed so cinemas and shows can point at a city.
export const CITY_SEED: readonly City[] = [
  { id: 'city-mumbai', name: 'Mumbai', state: 'Maharashtra', country: 'India' },
  { id: 'city-delhi', name: 'Delhi', state: 'Delhi', country: 'India' },
  { id: 'city-bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India' },
  { id: 'city-hyderabad', name: 'Hyderabad', state: 'Telangana', country: 'India' },
  { id: 'city-chennai', name: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  { id: 'city-kolkata', name: 'Kolkata', state: 'West Bengal', country: 'India' },
  { id: 'city-pune', name: 'Pune', state: 'Maharashtra', country: 'India' },
  { id: 'city-ahmedabad', name: 'Ahmedabad', state: 'Gujarat', country: 'India' },
];
