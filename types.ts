
import { DiamondShape } from './diamondConstants';

export enum GoldPurity {
  K24 = '24K',
  K22 = '22K',
  K21 = '21K',
  K18 = '18K',
  K14 = '14K',  
}

export type HollowType = 'none' | 'light' | 'deep';

export interface RingAnalysisResult {
  estimatedWidthMinMm: number;
  estimatedWidthMaxMm: number;
  estimatedThicknessMm: number;
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface CalculationResult {
  volumeCm3: number;
  massGrams: number;
  totalPriceAed: number;
  range: {
    minVolumeCm3: number;
    maxVolumeCm3: number;
    minMassGrams: number;
    maxMassGrams: number;
    minPriceAed: number;
    maxPriceAed: number;
  } | null;
}

export interface GoldAPIResponse {
  timestamp: number;
  metal: string;
  currency: string;
  price: number;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  price_gram_18k: number;
  price_gram_14k: number;
  price_gram_10k: number;
}

export interface AppState {
  image: File | null;
  imagePreview: string | null;
  isAnalyzing: boolean;
  analysisResult: RingAnalysisResult | null;
  ringCircumference: string;
  selectedPurity: GoldPurity;
  currentGoldPriceAed: number;
  manualWidthMm: number;
  manualThicknessMm: number;
  hollowType: HollowType;
  isTapered: boolean;
  shankWidthMm: number;
  calculation: CalculationResult | null;
  // Diamond features
  isDiamondEnabled: boolean;
  diamondCarats: number;
  diamondShape: DiamondShape;
  estimatedDiamondDimensions: string | null;
  isEstimatingDiamond: boolean;
}
