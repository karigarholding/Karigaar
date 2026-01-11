import React from 'react';
import { RingAnalysisResult } from '../types';
import { Ruler, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnalysisViewProps {
  imagePreview: string | null;
  result: RingAnalysisResult | null;
  isAnalyzing: boolean;
  manualWidth: number;
  manualThickness: number;
  onWidthChange: (val: number) => void;
  onThicknessChange: (val: number) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  imagePreview,
  result,
  isAnalyzing,
  manualWidth,
  manualThickness,
  onWidthChange,
  onThicknessChange
}) => {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
            <ShieldCheck className="w-12 h-12 text-gold-400 animate-pulse" />
            <div className="absolute inset-0 bg-gold-400/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <div className="text-center">
          <p className="text-gold-200 font-medium font-serif text-lg">Independent Consensus Analysis</p>
          <p className="text-slate-500 text-xs mt-1">Cross-verifying 3 isolated reasoning tracks to eliminate AI bias...</p>
        </div>
      </div>
    );
  }

  if (!result || !imagePreview) return null;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Image Preview */}
        <div className="w-full md:w-1/3 relative group">
          <div className="aspect-square rounded-xl overflow-hidden border-2 border-gold-500/30 shadow-2xl">
            <img 
              src={imagePreview} 
              alt="Uploaded Ring" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-center text-gold-100">
              {result.description}
            </div>
          </div>
        </div>

        {/* Adjustments */}
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex items-start gap-3">
             <Ruler className="w-5 h-5 text-gold-400 mt-1" />
             <div>
               <h3 className="text-lg font-serif text-white">Consensus Dimensions</h3>
               <p className="text-sm text-slate-400">
                 Triple-Pass Independent Estimate: Width <strong>{result.estimatedWidthMinMm}-{result.estimatedWidthMaxMm}mm</strong>
               </p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-lg border border-white/10 hover:border-gold-500/50 transition-colors">
              <label className="block text-xs font-medium text-gold-300 uppercase tracking-wider mb-2">
                Refined Width (mm)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.1"
                  value={manualWidth}
                  onChange={(e) => onWidthChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <input 
                  type="number"
                  value={manualWidth}
                  onChange={(e) => onWidthChange(parseFloat(e.target.value))}
                  className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-right focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>Min: {result.estimatedWidthMinMm}mm</span>
                <span>Max: {result.estimatedWidthMaxMm}mm</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-lg border border-white/10 hover:border-gold-500/50 transition-colors">
              <label className="block text-xs font-medium text-gold-300 uppercase tracking-wider mb-2">
                Thickness (mm)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={manualThickness}
                  onChange={(e) => onThicknessChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <input 
                  type="number"
                  value={manualThickness}
                  onChange={(e) => onThicknessChange(parseFloat(e.target.value))}
                  className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-right focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {result.confidence === 'Low' && (
             <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-2 rounded">
                <AlertTriangle className="w-4 h-4" />
                <span>Consensus variance high. Please verify measurements manually.</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};