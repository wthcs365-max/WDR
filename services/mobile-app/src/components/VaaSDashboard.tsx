import React from 'react';
import { RefreshCw, Pause, Play, ChevronRight, Fuel, Calendar } from 'lucide-react';

interface VaaSDashboardProps {
  kmUsed: number;
  kmLimit: number;
  activeVehicle: { make: string; model: string; image: string; rate: number } | null;
  subscriptionStatus: 'active' | 'paused' | 'cancelled';
  onSwitchVehicle: () => void;
  onTogglePause: () => void;
  onNavigateToPlans: () => void;
}

export const VaaSDashboard: React.FC<VaaSDashboardProps> = ({
  kmUsed,
  kmLimit,
  activeVehicle,
  subscriptionStatus,
  onSwitchVehicle,
  onTogglePause,
  onNavigateToPlans,
}) => {
  // SVG gauge constants
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (kmUsed / kmLimit) * 100));
  // The progress starts from top center (12 o'clock) and goes clockwise
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-charcoal-light/30">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gold shadow-glow" />
          <span className="text-xs text-slate-400 font-medium">WTH DRIVE RENTALS</span>
        </div>
        <button className="flex flex-col space-y-1 p-1">
          <div className="w-5 h-0.5 bg-gold" />
          <div className="w-5 h-0.5 bg-gold" />
          <div className="w-5 h-0.5 bg-gold" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gold">VaaS Dashboard</h1>
          <p className="text-xs text-gold/80 mt-0.5">Current Plan: VaaS Plus</p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-52 h-52 flex items-center justify-center">
            
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="104"
                cy="104"
                r={radius}
                className="stroke-charcoal-light/30 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="104"
                cy="104"
                r={radius}
                className="stroke-gold fill-none transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Mileage Stats Overlay */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-gold tracking-tight">{kmUsed.toLocaleString()}</span>
              <span className="text-xs font-semibold text-gold/80 mt-0.5">/ {kmLimit.toLocaleString()} km</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Used</span>
            </div>
          </div>
        </div>

        {/* Active Vehicle Slot */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Vehicle Slot</span>
          
          {activeVehicle ? (
            <div className="bg-charcoal border border-charcoal-light/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-charcoal-dark border border-charcoal-light/20 flex items-center justify-center">
                  <img src={activeVehicle.image} alt={activeVehicle.model} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gold">{activeVehicle.make} {activeVehicle.model}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                    <Fuel className="w-3.5 h-3.5 text-gold-light" />
                    <span>Active Allocation • Insurance Included</span>
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald/10 text-emerald border border-emerald/20 px-2 py-0.5 rounded-full font-bold">Active</span>
            </div>
          ) : (
            <div 
              onClick={onSwitchVehicle}
              className="bg-charcoal/40 border border-dashed border-charcoal-light/60 rounded-xl p-6 text-center cursor-pointer hover:border-gold/30 hover:bg-charcoal/60 transition-all duration-200"
            >
              <p className="text-xs text-slate-400">No vehicle currently assigned to this slot.</p>
              <p className="text-[11px] text-gold font-bold mt-1.5 hover:underline">Select a Pool Vehicle Now</p>
            </div>
          )}
        </div>

        {/* Quick Actions Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onSwitchVehicle}
            className="bg-gold hover:bg-gold-dark text-charcoal-dark font-bold py-3 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch Vehicle</span>
          </button>
          
          <button
            onClick={onTogglePause}
            className={`font-bold py-3 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 border shadow-medium ${
              subscriptionStatus === 'paused'
                ? 'bg-emerald border-emerald text-white hover:bg-emerald-dark'
                : 'bg-gold hover:bg-gold-dark text-charcoal-dark border-gold'
            }`}
          >
            {subscriptionStatus === 'paused' ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Sub</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Sub</span>
              </>
            )}
          </button>
        </div>

        {/* Subscription Info Footer */}
        <div className="bg-charcoal/60 border border-charcoal-light/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gold" />
            <div>
              <span className="text-xs font-bold block">Next Renewal</span>
              <span className="text-[10px] text-slate-400">01 July 2026 • Auto-renew enabled</span>
            </div>
          </div>
          <button 
            onClick={onNavigateToPlans}
            className="text-[11px] text-gold font-bold flex items-center hover:underline"
          >
            <span>Change Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
