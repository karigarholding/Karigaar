
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalysisView } from './components/AnalysisView';
import { CalculatorForm } from './components/CalculatorForm';
import { analyzeRingImage, estimateDiamondDimensions } from './services/geminiService';
import { fetchGoldPrices } from './services/goldPriceService';
import { RingAnalysisResult, GoldPurity, CalculationResult, HollowType } from './types';
import { GOLD_DENSITIES, RING_SIZES_CIRCUMFERENCE } from './constants';
import { DIAMOND_SHAPES, DiamondShape, getClosestDiamondDimension } from './diamondConstants';
import { Upload, Camera, RefreshCcw, MoveHorizontal, Diamond, Sparkles, Loader2, ChevronDown } from 'lucide-react';

const LABOUR_COST = 375;
const SOLDER_BUFFER = 1.02;

type RingProfile = 'flat' | 'domed' | 'comfort';

const getCrossSectionalArea = (profile: RingProfile, w: number, t: number): number => {
  switch (profile) {
    case 'flat': return w * t;
    case 'domed': return (2 / 3) * w * t;
    case 'comfort': return 0.9 * w * t;
    default: return w * t;
  }
};

const HOLLOW_FACTORS: Record<HollowType, number> = {
  none: 0,
  light: 0.30,
  deep: 0.55,
};

export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RingAnalysisResult | null>(null);
  const [marketPrices, setMarketPrices] = useState<Record<GoldPurity, number> | null>(null);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [ringCircumference, setRingCircumference] = useState<string>("52");
  const [purity, setPurity] = useState<GoldPurity>(GoldPurity.K21);
  const [goldPrice, setGoldPrice] = useState<number>(0); 
  const [hollowType, setHollowType] = useState<HollowType>('none');
  const [profile, setProfile] = useState<RingProfile>("domed");
  const [isTapered, setIsTapered] = useState<boolean>(false);
  const [shankWidth, setShankWidth] = useState<number>(2.0);
  const [manualWidth, setManualWidth] = useState<number>(0);
  const [manualThickness, setManualThickness] = useState<number>(0);

  // Diamond State
  const [isDiamondEnabled, setIsDiamondEnabled] = useState(false);
  const [diamondShape, setDiamondShape] = useState<DiamondShape>('Round');
  const [diamondCarats, setDiamondCarats] = useState<number>(1.0);
  const [estimatedDiamondDimensions, setEstimatedDiamondDimensions] = useState<string | null>(null);
  const [isEstimatingDiamond, setIsEstimatingDiamond] = useState(false);
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      setIsFetchingPrices(true);
      try {
        const prices = await fetchGoldPrices();
        setMarketPrices(prices);
        if (prices[purity]) setGoldPrice(prices[purity]);
      } catch (e) {
        setGoldPrice(250); 
      } finally {
        setIsFetchingPrices(false);
      }
    };
    loadPrices();
  }, []);

  useEffect(() => {
    if (marketPrices && marketPrices[purity]) {
      setGoldPrice(marketPrices[purity]);
    }
  }, [purity, marketPrices]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setAnalysisResult(null);
    setResult(null);
    setIsAnalyzing(true);

    try {
      const aiResult = await analyzeRingImage(file);
      setAnalysisResult(aiResult);
      const avgWidth = (aiResult.estimatedWidthMinMm + aiResult.estimatedWidthMaxMm) / 2;
      setManualWidth(parseFloat(avgWidth.toFixed(2)));
      setManualThickness(aiResult.estimatedThicknessMm);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEstimateDiamond = async () => {
    if (diamondCarats <= 0) return;
    setIsEstimatingDiamond(true);
    try {
      const dimensions = await estimateDiamondDimensions(diamondCarats, diamondShape, image);
      setEstimatedDiamondDimensions(dimensions);
    } catch (error) {
      console.error("Diamond estimation failed", error);
      // Fast fallback to local mapping
      setEstimatedDiamondDimensions(getClosestDiamondDimension(diamondShape, diamondCarats));
    } finally {
      setIsEstimatingDiamond(false);
    }
  };

  const calculate = () => {
    const innerCircumferenceMm = RING_SIZES_CIRCUMFERENCE[ringCircumference];
    if (!innerCircumferenceMm) return;

    const calculateForWidth = (wMm: number) => {
      const effectiveWidth = isTapered ? (wMm + shankWidth) / 2 : wMm;
      const meanCircumferenceMm = innerCircumferenceMm + (Math.PI * manualThickness);
      const areaMm2 = getCrossSectionalArea(profile, effectiveWidth, manualThickness);
      let volumeMm3 = meanCircumferenceMm * areaMm2;
      const density = GOLD_DENSITIES[purity];
      let mass = (volumeMm3 / 1000) * density;
      const reductionFactor = HOLLOW_FACTORS[hollowType];
      mass = mass * (1 - reductionFactor);
      let materialVolumeCm3 = (volumeMm3 / 1000) * (1 - reductionFactor);
      const finalMass = mass * SOLDER_BUFFER;
      const materialPrice = finalMass * goldPrice;
      return { volumeCm3: materialVolumeCm3, mass: finalMass, materialPrice };
    };

    const selected = calculateForWidth(manualWidth);
    const totalPrice = selected.materialPrice + LABOUR_COST;

    let rangeData = null;
    if (analysisResult) {
      const minStats = calculateForWidth(analysisResult.estimatedWidthMinMm);
      const maxStats = calculateForWidth(analysisResult.estimatedWidthMaxMm);
      rangeData = {
        minVolumeCm3: parseFloat(minStats.volumeCm3.toFixed(3)),
        maxVolumeCm3: parseFloat(maxStats.volumeCm3.toFixed(3)),
        minMassGrams: parseFloat(minStats.mass.toFixed(2)),
        maxMassGrams: parseFloat(maxStats.mass.toFixed(2)),
        minPriceAed: parseFloat((minStats.materialPrice + LABOUR_COST).toFixed(2)),
        maxPriceAed: parseFloat((maxStats.materialPrice + LABOUR_COST).toFixed(2)),
      };
    }

    setResult({
      volumeCm3: parseFloat(selected.volumeCm3.toFixed(3)),
      massGrams: parseFloat(selected.mass.toFixed(2)),
      totalPriceAed: parseFloat(totalPrice.toFixed(2)),
      range: rangeData
    });
  };

  const reset = () => {
    setImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setResult(null);
    setManualWidth(0);
    setManualThickness(0);
    setHollowType('none');
    setProfile("domed");
    setIsTapered(false);
    setShankWidth(2.0);
    setIsDiamondEnabled(false);
    setDiamondCarats(1.0);
    setDiamondShape('Round');
    setEstimatedDiamondDimensions(null);
  };

  const isFancyCut = ['Emerald', 'Marquise', 'Oval', 'Pear', 'Radiant'].includes(diamondShape);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-gold-500/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {!image && (
          <div className="border-2 border-dashed border-slate-700 hover:border-gold-500/50 rounded-2xl p-12 transition-all bg-slate-800/20">
             <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                <Camera className="w-10 h-10 text-gold-500" />
              </div>
              <h2 className="text-2xl font-serif text-white">Jewelry Vision Estimator</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Upload a clear photo for high-precision AI dimensioning and weight calculation.
              </p>
              <div className="flex justify-center pt-4">
                <label className="cursor-pointer group relative overflow-hidden bg-gold-500 hover:bg-gold-400 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg shadow-gold-900/20">
                  <span className="relative z-10 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Analyze Jewelry
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {image && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif text-gold-100">AI Analysis Module</h2>
                <button onClick={reset} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 group">
                  <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> Start Over
                </button>
            </div>

            <AnalysisView 
              imagePreview={imagePreview}
              result={analysisResult}
              isAnalyzing={isAnalyzing}
              manualWidth={manualWidth}
              manualThickness={manualThickness}
              onWidthChange={setManualWidth}
              onThicknessChange={setManualThickness}
            />

            {/* Advanced Diamond Estimator */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isDiamondEnabled ? 'bg-gold-500/20 shadow-lg shadow-gold-500/10' : 'bg-slate-700'}`}>
                    <Diamond className={`w-5 h-5 ${isDiamondEnabled ? 'text-gold-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Center Stone Add-on</h3>
                    <p className="text-[10px] text-slate-500 uppercase">Multi-shape dimension estimator</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDiamondEnabled(!isDiamondEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isDiamondEnabled ? 'bg-gold-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDiamondEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {isDiamondEnabled && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-white/5 animate-fade-in">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gold-300 uppercase tracking-widest">Stone Shape</label>
                    <div className="relative">
                      <select 
                        value={diamondShape}
                        onChange={(e) => setDiamondShape(e.target.value as DiamondShape)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500/50 outline-none appearance-none transition-all cursor-pointer"
                      >
                        {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gold-300 uppercase tracking-widest">Weight (ct)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={diamondCarats}
                        onChange={(e) => setDiamondCarats(parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500/50 outline-none transition-all"
                        placeholder="1.0"
                      />
                      <button 
                        onClick={handleEstimateDiamond}
                        disabled={isEstimatingDiamond || diamondCarats <= 0}
                        className="bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 p-3 rounded-xl border border-gold-500/30 transition-all disabled:opacity-50 group"
                      >
                        {isEstimatingDiamond ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center shadow-inner">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">{isFancyCut ? 'Estimated Dimensions' : 'Estimated Diameter'}</p>
                    {estimatedDiamondDimensions ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-serif font-bold text-white tracking-tighter">{estimatedDiamondDimensions}</span>
                        <span className="text-xs text-gold-400 font-bold uppercase">mm</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px] italic">Select shape & weight</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Cross-Sectional Profile</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['flat', 'domed', 'comfort'] as RingProfile[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfile(p)}
                      className={`py-2 px-3 rounded-xl border transition-all capitalize text-xs font-semibold ${
                        profile === p 
                          ? 'border-gold-500 bg-gold-500/10 text-gold-200' 
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Shank Architecture</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-bold tracking-tighter ${!isTapered ? 'text-gold-500' : 'text-slate-500'}`}>Uniform</span>
                    <button 
                      onClick={() => setIsTapered(!isTapered)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${isTapered ? 'bg-gold-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isTapered ? 'left-6' : 'left-1'}`}></div>
                    </button>
                    <span className={`text-[9px] uppercase font-bold tracking-tighter ${isTapered ? 'text-gold-500' : 'text-slate-500'}`}>Tapered</span>
                  </div>
                </div>

                {isTapered && (
                  <div className="animate-fade-in space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                      <MoveHorizontal className="w-3 h-3 text-gold-500" />
                      <span>Bottom Shank: <strong>{shankWidth}mm</strong></span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max={manualWidth || 5}
                      step="0.1"
                      value={shankWidth}
                      onChange={(e) => setShankWidth(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <CalculatorForm 
              ringCircumference={ringCircumference}
              setRingCircumference={setRingCircumference}
              purity={purity}
              setPurity={setPurity}
              goldPrice={goldPrice}
              setGoldPrice={setGoldPrice}
              hollowType={hollowType}
              setHollowType={setHollowType}
              onCalculate={calculate}
              isValid={!isAnalyzing && manualWidth > 0 && goldPrice > 0}
            />
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-slide-up pb-12">
            <div className="bg-gradient-to-br from-gold-50 to-gold-200 rounded-3xl p-10 text-slate-900 shadow-[0_20px_50px_rgba(202,138,4,0.3)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-900/10">
                <div className="space-y-1 py-4 md:py-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">Estimated Mass</p>
                  <p className="text-5xl font-serif font-bold text-slate-900">{result.massGrams}g</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {purity} {hollowType !== 'none' && `(${hollowType} hollow)`}
                  </p>
                </div>
                
                <div className="space-y-1 py-4 md:py-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">Gold Market Rate</p>
                  <p className="text-5xl font-serif font-bold text-slate-900">{goldPrice.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AED / gram</p>
                </div>

                <div className="space-y-1 py-4 md:py-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">Valuation</p>
                  <p className="text-6xl font-serif font-bold text-gold-700 tracking-tighter drop-shadow-sm">
                    <span className="text-2xl align-top mr-1 font-sans">AED</span>{result.totalPriceAed.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">+ AED 375 labor cost</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
