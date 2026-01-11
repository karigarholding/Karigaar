
import React from 'react';
import { Gem } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="py-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-gold-300 to-gold-600 rounded-lg shadow-lg shadow-gold-500/20">
            <Gem className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 tracking-wide uppercase">
            Karigar
          </h1>
        </div>
      </div>
    </header>
  );
};
