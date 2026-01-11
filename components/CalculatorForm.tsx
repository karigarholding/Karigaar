import React from 'react';
import { GoldPurity, HollowType } from '../types';
import { RING_SIZES_CIRCUMFERENCE } from '../constants';
import { Scale, Coins, Radio, CircleDashed, Circle, Hexagon } from 'lucide-react';

interface CalculatorFormProps {
  ringCircumference: string;
  setRingCircumference: (val: string) => void;
  purity: GoldPurity;
  setPurity: (val: GoldPurity) => void;
  goldPrice: number;
  setGoldPrice: (val: number) => void;
  hollowType: HollowType;
  setHollowType: (val: HollowType) => void;
  onCalculate: () => void;
  isValid: boolean;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  ringCircumference,
  setRingCircumference,
  purity,
  setPurity,
  goldPrice,
  setGoldPrice,
  hollowType,
  setHollowType,
  onCalculate,
  isValid
}) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-gold-400" />
        <h3 className="text-lg font-serif text-white">Specifications</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ring Circumference */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Ring Circumference (mm)</label>
          <select 
            value={ringCircumference}
            onChange={(e) => setRingCircumference(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all"
          >
            {Object.keys(RING_SIZES_CIRCUMFERENCE).map((size) => (
              <option key={size} value={size}>
                {size} mm
              </option>
            ))}
          </select>
        </div>

        {/* Construction Type (Hollow/Solid) */}
        <div className="space-y-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-300">Construction / Hollow Level</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setHollowType('none')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 ${
                hollowType === 'none' 
                ? 'bg-gold-500/20 border-gold-500 text-gold-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-xs font-semibold">Solid</span>
              <span className="text-[10px] opacity-70">100% Weight</span>
            </button>
            
            <button
              onClick={() => setHollowType('light')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 ${
                hollowType === 'light' 
                ? 'bg-gold-500/20 border-gold-500 text-gold-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <CircleDashed className="w-4 h-4" />
              <span className="text-xs font-semibold">Light Hollow</span>
              <span className="text-[10px] opacity-70">-30% Weight</span>
            </button>

            <button
              onClick={() => setHollowType('deep')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 ${
                hollowType === 'deep' 
                ? 'bg-gold-500/20 border-gold-500 text-gold-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Hexagon className="w-4 h-4" />
              <span className="text-xs font-semibold">Deep Hollow</span>
              <span className="text-[10px] opacity-70">-55% Weight</span>
            </button>
          </div>
        </div>

        {/* Gold Purity */}
        <div className="space-y-2 lg:col-span-2">
          <label className="block text-sm font-medium text-slate-300">Gold Purity</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(GoldPurity).map((p) => (
              <button
                key={p}
                onClick={() => setPurity(p)}
                className={`px-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  purity === p 
                    ? 'bg-gold-500 text-white border-gold-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Gold Price */}
        <div className="space-y-2 lg:col-span-2">
          <label className="block text-sm font-medium text-slate-300 flex justify-between items-center">
            <span>Market Price (AED/g)</span>
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <Radio className="w-3 h-3" />
              <span>Live</span>
            </div>
          </label>
          <div className="relative">
             <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
                type="number"
                min="0"
                step="0.01"
                value={goldPrice}
                onChange={(e) => setGoldPrice(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all"
                placeholder="0.00"
             />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={onCalculate}
          disabled={!isValid}
          className={`
            px-8 py-3 rounded-full font-bold text-lg tracking-wide shadow-xl transition-all
            ${isValid 
              ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-white hover:shadow-gold-500/25 hover:scale-105 active:scale-95' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          Calculate Value
        </button>
      </div>
    </div>
  );
};
