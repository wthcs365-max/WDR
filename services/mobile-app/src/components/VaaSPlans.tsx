import React, { useState } from 'react';
import { ShieldCheck, Check, Sparkles } from 'lucide-react';

interface VaaSPlansProps {
  score: number;
  onSelectPlan: (plan: 'flex' | 'plus' | 'business') => void;
  onNavigateToDashboard: () => void;
}

export const VaaSPlans: React.FC<VaaSPlansProps> = ({
  score,
  onSelectPlan,
  onNavigateToDashboard,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Trust-adjusted pricing calculations based on user score
  const getPlanPrice = (baseMonthly: number) => {
    // Up to 30% discount for high trust scores!
    const discount = Math.min(30, Math.max(0, Math.floor((score - 600) / 10)));
    const monthlyRate = baseMonthly * (1 - discount / 100);
    const finalRate = billingPeriod === 'annual' ? monthlyRate * 0.85 : monthlyRate; // additional 15% discount for annual
    return Math.round(finalRate);
  };

  const trustDiscountPercent = Math.min(30, Math.max(0, Math.floor((score - 600) / 10)));

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-charcoal-light/30">
        <span className="text-xs text-slate-400 font-medium">WTH DRIVE RENTALS</span>
        <button 
          onClick={onNavigateToDashboard}
          className="text-xs text-gold font-bold hover:underline"
        >
          Cancel
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">VaaS Subscription Plans</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Flexible, no-deposit mobility subscriptions with built-in premium insurance.
          </p>
        </div>

        {/* Billing Period Selector */}
        <div className="bg-charcoal/60 p-1 rounded-xl border border-charcoal-light/30 flex max-w-[240px] mx-auto">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              billingPeriod === 'monthly' ? 'bg-gold text-charcoal-dark shadow-glow' : 'text-slate-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1 ${
              billingPeriod === 'annual' ? 'bg-gold text-charcoal-dark shadow-glow' : 'text-slate-400'
            }`}
          >
            <span>Annual</span>
            <span className="text-[9px] bg-emerald text-white px-1 py-0.5 rounded-md font-bold uppercase tracking-wider">-15%</span>
          </button>
        </div>

        {/* Trust Score Banner */}
        {trustDiscountPercent > 0 && (
          <div className="bg-emerald/10 border border-emerald/30 p-3.5 rounded-xl flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-emerald-light animate-pulse flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-light">Trust Discount Applied! </span>
              <span className="text-slate-300">Your Trust Alpha score of <strong>{score}</strong> unlocks an exclusive <strong>{trustDiscountPercent}% discount</strong> on all subscription tiers.</span>
            </div>
          </div>
        )}

        {/* Tier Cards Container */}
        <div className="space-y-4">
          
          {/* FLEX PLAN CARD */}
          <div className="bg-charcoal border border-charcoal-light/30 rounded-2xl p-5 space-y-4 hover:border-gold/20 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Flex</h3>
                <p className="text-[11px] text-slate-400">Pool vehicle access on-demand</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">R {getPlanPrice(2999)}</span>
                <span className="text-xs text-slate-400 block">/ month</span>
              </div>
            </div>
            
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>500 km monthly mileage allowance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>Comprehensive Standard Insurance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>Zero Upfront Deposit</span>
              </li>
            </ul>

            <button
              onClick={() => onSelectPlan('flex')}
              className="w-full bg-charcoal-light/40 hover:bg-charcoal-light/60 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-200 border border-charcoal-light/30"
            >
              Select Flex Plan
            </button>
          </div>

          {/* PLUS PLAN CARD (RECOMMENDED / SAFARI GOLD) */}
          <div className="bg-gradient-to-b from-gold/90 to-gold-dark/95 border border-gold rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-glow text-charcoal-dark">
            <div className="absolute top-0 right-0 bg-charcoal-dark text-gold text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Recommended
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Plus</h3>
                <p className="text-[11px] text-charcoal-dark/70">Dedicated private vehicle allocation</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">R {getPlanPrice(4999)}</span>
                <span className="text-xs text-charcoal-dark/70 block">/ month</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs font-medium text-charcoal-dark/90">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-charcoal-dark" />
                <span>1,000 km monthly mileage allowance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-charcoal-dark" />
                <span>Comprehensive Premium Insurance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-charcoal-dark" />
                <span>Zero Upfront Deposit</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-charcoal-dark" />
                <span>Dedicated BMW 320i or similar</span>
              </li>
            </ul>

            <button
              onClick={() => onSelectPlan('plus')}
              className="w-full bg-charcoal-dark hover:bg-charcoal text-gold font-bold py-3 rounded-xl text-xs transition-all duration-200 shadow-medium"
            >
              Subscribe to VaaS Plus
            </button>
          </div>

          {/* BUSINESS PLAN CARD */}
          <div className="bg-charcoal border border-charcoal-light/30 rounded-2xl p-5 space-y-4 hover:border-gold/20 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Business</h3>
                <p className="text-[11px] text-slate-400">Consolidated SME fleet allocation</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">R {getPlanPrice(6999)}</span>
                <span className="text-xs text-slate-400 block">/ month</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>2,000 km monthly mileage allowance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>SME Fleet Comprehensive Insurance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>Consolidated corporate VAT billing</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald" />
                <span>Multiple approved drivers & tracking</span>
              </li>
            </ul>

            <button
              onClick={() => onSelectPlan('business')}
              className="w-full bg-charcoal-light/40 hover:bg-charcoal-light/60 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-200 border border-charcoal-light/30"
            >
              Select Business Plan
            </button>
          </div>

        </div>

        <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Frictionless POPIA and FICA Underwriting</span>
        </div>
      </div>
    </div>
  );
};
