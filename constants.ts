import { GoldPurity } from './types';

// Density in g/cm^3
export const GOLD_DENSITIES: Record<GoldPurity, number> = {
  [GoldPurity.K24]: 19.32,
  [GoldPurity.K22]: 17.70,
  [GoldPurity.K21]: 17.00, // Approximate common value used in trade
  [GoldPurity.K18]: 15.20,
  [GoldPurity.K14]: 13.40,
};

// Map Display Label to Inner Circumference in mm
export const RING_SIZES_CIRCUMFERENCE: Record<string, number> = {
  "40": 40,
  "41": 41,
  "42": 42,
  "43": 43,
  "44": 44,
  "45": 45,
  "46": 46,
  "47": 47,
  "48": 48,
  "49": 49,
  "50": 50,
  "51": 51,
  "52": 52,
  "53": 53,
  "54": 54,
  "55": 55,
  "56": 56,
  "57": 57,
  "58": 58,
  "59": 59,
  "60": 60,
  "61": 61,
  "62": 62,
  "63": 63,
  "64": 64,
  "65": 65,
  "66": 66,
  "67": 67,
  "68": 68,
  "69": 69,
  "70": 70,
  "71": 71,
  "72": 72,
  "73": 73,
  "74": 74,
  "75": 75,
};
