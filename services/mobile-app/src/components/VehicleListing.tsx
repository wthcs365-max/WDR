import React, { useState } from 'react';
import { ShieldCheck, Star, Sparkles, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { OwnershipType } from '@wdr/shared-types';

interface VehicleListingProps {
  onNavigateToDashboard: () => void;
  onNavigateToShield: () => void;
  onSelectVehicle?: (v: { id: string; make: string; model: string; image: string; rate: number }) => void;
}

export const VehicleListing: React.FC<VehicleListingProps> = ({
  onNavigateToDashboard,
  onNavigateToShield,
  onSelectVehicle,
}) => {
  const [filter, setFilter] = useState<'all' | 'dealer' | 'p2p'>('all');

  const mockVehicles = [
    {
      id: '1',
      make: 'BMW',
      model: '3 Series 320i',
      year: 2022,
      priceZar: 850,
      ownershipType: OwnershipType.DEALER,
      dealerName: 'Sandton BMW Exchange',
      rating: 4.9,
      trips: 142,
      photos: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
    },
    {
      id: '2',
      make: 'Toyota',
      model: 'Hilux Double Cab',
      year: 2021,
      priceZar: 1100,
      ownershipType: OwnershipType.FLEET_OPERATOR,
      dealerName: 'WDR Enterprise Fleets',
      rating: 4.8,
      trips: 94,
      photos: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
    },
    {
      id: '3',
      make: 'Volkswagen',
      model: 'Polo Vivo 1.4',
      year: 2023,
      priceZar: 420,
      ownershipType: OwnershipType.PRIVATE_OWNER,
      dealerName: 'Private Owner (Sipho M.)',
      rating: 4.7,
      trips: 32,
      photos: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=400',
      isVerified: false,
    }
  ];

  const filteredVehicles = mockVehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'dealer') return v.ownershipType === OwnershipType.DEALER;
    if (filter === 'p2p') return v.ownershipType === OwnershipType.PRIVATE_OWNER;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-charcoal-light/30 bg-charcoal/40">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onNavigateToDashboard}
            className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center border border-charcoal-light/30 hover:bg-charcoal-light/30 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </button>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Available in</span>
            <h2 className="text-sm font-bold text-white">Johannesburg, GP</h2>
          </div>
        </div>

        {/* Categories Switches */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${
              filter === 'all' 
                ? 'bg-gold border-gold text-charcoal-dark shadow-glow' 
                : 'bg-charcoal border-charcoal-light/20 text-slate-400 hover:text-white'
            }`}
          >
            All Vehicles
          </button>
          <button
            onClick={() => setFilter('dealer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center space-x-1 ${
              filter === 'dealer' 
                ? 'bg-gold border-gold text-charcoal-dark shadow-glow' 
                : 'bg-charcoal border-charcoal-light/20 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Dealers</span>
          </button>
          <button
            onClick={() => setFilter('p2p')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${
              filter === 'p2p' 
                ? 'bg-gold border-gold text-charcoal-dark shadow-glow' 
                : 'bg-charcoal border-charcoal-light/20 text-slate-400 hover:text-white'
            }`}
          >
            Top P2P
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
          <span>Found {filteredVehicles.length} premium vehicles</span>
          <div className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-semibold">Filters</span>
          </div>
        </div>

        {/* Vehicles Feed */}
        <div className="space-y-4">
          {filteredVehicles.map((vehicle) => (
            <div 
              key={vehicle.id}
              onClick={() => {
                if (onSelectVehicle) {
                  onSelectVehicle({
                    id: vehicle.id,
                    make: vehicle.make,
                    model: vehicle.model,
                    image: vehicle.photos,
                    rate: vehicle.priceZar
                  });
                } else {
                  onNavigateToShield();
                }
              }}
              className="bg-charcoal border border-charcoal-light/30 rounded-2xl overflow-hidden cursor-pointer hover:border-gold/30 transition-all duration-300 shadow-medium group"
            >
              {/* Image Container */}
              <div className="relative h-44 bg-charcoal-dark overflow-hidden">
                <img 
                  src={vehicle.photos} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                />

                {/* Badging overlay */}
                {vehicle.isVerified && (
                  <div className="absolute top-3 left-3 bg-charcoal-dark/80 backdrop-blur-md text-gold border border-gold/30 rounded-xl px-2.5 py-1 flex items-center space-x-1 shadow-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Dealer Verified</span>
                  </div>
                )}

                {/* Daily rate overlay */}
                <div className="absolute bottom-3 right-3 bg-charcoal-dark/90 backdrop-blur-md border border-charcoal-light/30 rounded-xl px-3 py-1 flex flex-col items-end">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Rate</span>
                  <span className="text-sm font-bold text-white">R {vehicle.priceZar} <span className="text-[11px] text-slate-400 font-normal">/ day</span></span>
                </div>
              </div>

              {/* Information Row */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">{vehicle.make} {vehicle.model}</h3>
                    <span className="text-[11px] text-slate-500 font-semibold">{vehicle.year} • Automatic • Petrol</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-charcoal-light/20 px-2 py-0.5 rounded-lg border border-charcoal-light/20">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="text-xs font-bold text-slate-200">{vehicle.rating}</span>
                  </div>
                </div>

                {/* Host Line */}
                <div className="flex items-center justify-between pt-2 border-t border-charcoal-light/20 text-xs text-slate-400">
                  <span className="truncate">{vehicle.dealerName}</span>
                  <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">{vehicle.trips} trips completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
