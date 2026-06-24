import React from 'react';
import { ArrowLeft, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

interface VaaSBookingProps {
  vehicle: { make: string; model: string; image: string; rate: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const VaaSBooking: React.FC<VaaSBookingProps> = ({
  vehicle,
  onConfirm,
  onCancel,
}) => {
  if (!vehicle) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
        <button 
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">WTH DRIVE RENTALS</span>
        <div className="w-8" /> {/* Balance spacer */}
      </div>

      {/* Viewport Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
        
        {/* Title and Badge */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">One-Tap VaaS Booking</h1>
          <div className="inline-flex items-center space-x-1 bg-gold/10 text-gold-dark px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plus Subscriber</span>
          </div>
        </div>

        {/* Central "Book Instantly" Block */}
        <div className="my-6 space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book Instantly</h2>
            <p className="text-xs text-slate-500 mt-1">Zero deposit. Covered by your active subscription plan.</p>
          </div>

          {/* Vehicle card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-3">
            <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative">
              <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 bg-slate-950/80 text-gold text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Deposit</span>
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">{vehicle.make} {vehicle.model}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sandton Hub, JHB</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald">Included</span>
                <span className="text-[10px] text-slate-400 block">Subscription Benefit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zero-Payment UI breakdown */}
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Rental Charge:</span>
              <span className="font-bold text-slate-900">R 0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Security Deposit:</span>
              <span className="font-bold text-emerald">WAIVED (R 0.00)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Comprehensive Insurance:</span>
              <span className="font-bold text-emerald">Covered</span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="w-full bg-[#C5A059] hover:bg-[#b28e46] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-glow flex items-center justify-center space-x-2"
          >
            <span>Confirm Trip</span>
          </button>
        </div>

      </div>
    </div>
  );
};
