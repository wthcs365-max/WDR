import React from 'react';
import { Shield, ChevronRight, HelpCircle, TrendingUp } from 'lucide-react';
import { TrustTier } from '@wdr/shared-types';

interface TrustDashboardProps {
  score: number;
  tier: TrustTier;
  waiverActive: boolean;
  onNavigateToShield: () => void;
}

export const TrustDashboard: React.FC<TrustDashboardProps> = ({
  score,
  tier,
  waiverActive,
  onNavigateToShield,
}) => {
  // Calculate SVG gauge properties
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // We want a semi-circle or 3/4 circle. Let's do a 3/4 circle (270 degrees)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (score / 1000) * arcLength;

  // Tier info helpers
  const getTierDetails = (t: TrustTier) => {
    switch (t) {
      case TrustTier.DIAMOND:
        return { label: 'Diamond Tier', color: 'text-gold', desc: 'Elite status. Complete deposit waivers and priority support.' };
      case TrustTier.PLATINUM:
        return { label: 'Platinum Tier', color: 'text-gold-light', desc: 'Premium status. 90% deposit waiver and low rates.' };
      case TrustTier.GOLD:
        return { label: 'Gold Tier', color: 'text-gold-dark', desc: 'Trusted partner. 75% deposit waiver eligibility.' };
      case TrustTier.SILVER:
        return { label: 'Silver Tier', color: 'text-slate-300', desc: 'Standard access. Basic deposit requirements.' };
      default:
        return { label: 'Bronze Tier', color: 'text-slate-400', desc: 'Starter level. Full deposit required.' };
    }
  };

  const tierDetails = getTierDetails(tier);

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-charcoal-light/30">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">WTH Drive Rentals</span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 cursor-pointer" />
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Trust Dashboard</h1>

        {/* Trust Gauge Card */}
        <div className="bg-charcoal p-6 rounded-2xl border border-charcoal-light/40 shadow-medium relative overflow-hidden flex flex-col items-center">
          {/* Subtle gold glow background */}
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gold/5 blur-2xl" />

          {/* SVG Gauge */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-225">
              {/* Background Track */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-charcoal-light/40 fill-none"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0.25} // Open 25% of the circle at the bottom
              />
              {/* Progress Track */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-gold fill-none transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset + (circumference * 0.25)} // adjust for open part
              />
            </svg>

            {/* Score Text Inside Gauge */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Trust Alpha</span>
              <span className="text-4xl font-bold text-white mt-1 transition-all duration-500">{score}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-1">out of 1000</span>
            </div>
          </div>

          {/* Tier Diamond Icon */}
          <div className="flex flex-col items-center mt-2">
            <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center border border-gold/30 shadow-glow mb-2 animate-bounce-slow">
              <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.54L18.46 12 12 18.46 5.54 12 12 5.54z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold tracking-wide ${tierDetails.color}`}>
              {tierDetails.label}
            </h2>
            <p className="text-xs text-slate-400 text-center px-4 mt-1.5 leading-relaxed">
              {tierDetails.desc}
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Benefits</h3>

          {/* Deposit Waiver Benefit Card */}
          <div 
            onClick={onNavigateToShield}
            className="bg-charcoal/60 border border-charcoal-light/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-charcoal/80 transition-all duration-200"
          >
            <div className="flex items-center space-x-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${waiverActive ? 'bg-emerald/10 border border-emerald/20 text-emerald' : 'bg-marigold/10 border border-marigold/20 text-marigold'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-white">Deposit Waiver</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${waiverActive ? 'bg-emerald/10 text-emerald' : 'bg-marigold/10 text-marigold'}`}>
                    {waiverActive ? 'Active' : 'Eligible'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {waiverActive ? 'Zero deposit required on bookings' : 'Traditional deposit required. Enable now.'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>

          {/* Premium Vehicle Access Card */}
          <div className="bg-charcoal/60 border border-charcoal-light/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10 border border-gold/20 text-gold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Premium Tier Access</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unlocked high-end luxury & commercial models
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Improvement Tips */}
        <div className="bg-gradient-to-br from-charcoal-light/20 to-charcoal/20 border border-charcoal-light/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300">How to increase your score?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your telematics profile, complete biometric identity validation, and maintain a safe speed rating on past trips. Every on-time rental return increases your score.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
