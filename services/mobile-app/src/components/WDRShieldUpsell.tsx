import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle, Info, ChevronLeft, Calendar } from 'lucide-react';

interface WDRShieldUpsellProps {
  score: number;
  waiverActive: boolean;
  onToggleWaiver: (status: boolean) => void;
  onNavigateToDashboard: () => void;
}

export const WDRShieldUpsell: React.FC<WDRShieldUpsellProps> = ({
  score,
  waiverActive,
  onToggleWaiver,
  onNavigateToDashboard,
}) => {
  const [days, setDays] = useState(3);
  const baseRate = 120; // daily shield waiver price ZAR
  // Discount based on score
  const discount = Math.min(50, Math.max(0, Math.floor((score - 500) / 10))); // Up to 50% discount for high scores!
  const finalDailyRate = Math.round(baseRate * (1 - discount / 100));
  const totalCost = finalDailyRate * days;
  const traditionalDeposit = 8500;

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Header */}
      <div className="p-4 border-b border-charcoal-light/30 flex items-center space-x-2 bg-charcoal/40">
        <button 
          onClick={onNavigateToDashboard}
          className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center border border-charcoal-light/30 hover:bg-charcoal-light/30 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="text-sm font-bold text-white">WDR Shield Protection</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto shadow-glow text-gold animate-pulse">
            {waiverActive ? <ShieldCheck className="w-9 h-9" /> : <ShieldAlert className="w-9 h-9" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-3">Deposit Waiver Option</h1>
          <p className="text-xs text-slate-400 px-4">
            Replace high-risk credit card deposits with a low, trust-adjusted daily protection rate.
          </p>
        </div>

        {/* Traditional Deposit vs WDR Shield */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-charcoal/40 border border-charcoal-light/20 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Traditional Deposit</span>
            <div className="text-lg font-bold text-slate-400">R {traditionalDeposit.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Held on credit card for up to 14 days post-trip.
            </p>
          </div>
          <div className="bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 rounded-xl p-4 space-y-1.5 relative overflow-hidden">
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold animate-ping" />
            <span className="text-[10px] text-gold font-bold uppercase tracking-wider">WDR Shield Waiver</span>
            <div className="text-lg font-bold text-white">R 0 <span className="text-xs text-gold-light font-medium">Deposit</span></div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Zero upfront holds. Fully covered by your Trust Score.
            </p>
          </div>
        </div>

        {/* Simulator controls */}
        <div className="bg-charcoal border border-charcoal-light/30 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-gold" />
            <span>Rental Duration Calculator</span>
          </h3>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Days Selected:</span>
              <span className="text-gold">{days} days</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="14" 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-1.5 bg-charcoal-light/40 rounded-lg appearance-none cursor-pointer accent-gold"
            />
          </div>

          <div className="border-t border-charcoal-light/20 pt-4 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Standard Daily Waiver Fee:</span>
              <span>R {baseRate} / day</span>
            </div>
            <div className="flex justify-between text-xs text-emerald font-medium">
              <span>Your Trust Discount ({discount}%):</span>
              <span>- R {baseRate - finalDailyRate} / day</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white border-t border-charcoal-light/20 pt-2.5">
              <span>Your Protected Rate:</span>
              <span className="text-gold">R {finalDailyRate} / day</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white border-b border-charcoal-light/20 pb-2.5">
              <span>Total Protection Cost:</span>
              <span className="text-emerald font-bold">R {totalCost} ZAR</span>
            </div>
          </div>
        </div>

        {/* Persistent toggle */}
        <div className="bg-charcoal/60 border border-charcoal-light/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-start space-x-3.5 mr-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${waiverActive ? 'bg-emerald/10 border border-emerald/20 text-emerald' : 'bg-charcoal-light border border-charcoal-light text-slate-400'}`}>
              {waiverActive ? <ShieldCheck className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white">Enable Deposit Waiver</span>
              <p className="text-[11px] text-slate-400 leading-normal">
                By enabling, you agree to pay the daily Shield fee of R {finalDailyRate} instead of holding R {traditionalDeposit}.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button 
            onClick={() => onToggleWaiver(!waiverActive)}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${waiverActive ? 'bg-gold shadow-glow justify-end' : 'bg-charcoal-light justify-start'}`}
          >
            <div className={`w-6 h-6 rounded-full shadow-medium bg-white transition-all duration-300 ${waiverActive ? 'bg-charcoal-dark' : ''}`} />
          </button>
        </div>

        {/* Protection list */}
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald" />
            <span>R 0 Deposit upfront required</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald" />
            <span>Comprehensive damage cover included</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald" />
            <span>POPI compliant secure validation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
