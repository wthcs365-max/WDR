import React from 'react';
import { Users, Truck, FileText, Download, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { TrustTier } from '@wdr/shared-types';

export const VaaSAdmin: React.FC = () => {
  const drivers = [
    {
      id: '1',
      name: 'Johannesburg Courier (Lerato M.)',
      email: 'lerato@couriers-sme.co.za',
      score: 875,
      tier: TrustTier.DIAMOND,
      vehicle: 'Toyota Hilux Double Cab',
      status: 'On Active Trip',
      statusColor: 'text-emerald bg-emerald/10 border-emerald/20',
    },
    {
      id: '2',
      name: 'Sales Executive (Pieter S.)',
      email: 'pieter@sales-sme.co.za',
      score: 790,
      tier: TrustTier.PLATINUM,
      vehicle: 'BMW 320i',
      status: 'On Active Trip',
      statusColor: 'text-emerald bg-emerald/10 border-emerald/20',
    },
    {
      id: '3',
      name: 'Technical Support (Dumisani K.)',
      email: 'dumi@support-sme.co.za',
      score: 685,
      tier: TrustTier.GOLD,
      vehicle: 'Volkswagen Polo',
      status: 'Parked / Off-Duty',
      statusColor: 'text-slate-400 bg-slate-100/10 border-slate-200/20',
    },
    {
      id: '4',
      name: 'Delivery Assistant (Chantel N.)',
      email: 'chantel@deliveries-sme.co.za',
      score: 550,
      tier: TrustTier.SILVER,
      vehicle: 'None (Unallocated)',
      status: 'Available',
      statusColor: 'text-gold bg-gold/10 border-gold/20',
    }
  ];

  return (
    <div className="bg-charcoal-dark text-slate-100 p-6 rounded-2xl border border-charcoal-light/30 space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Truck className="w-6 h-6 text-gold" />
            <span>SME Fleet VaaS Admin Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Enterprise Allocation Dashboard for WDR subscribers</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>VaaS Business Plan</span>
        </div>
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-3 gap-4">
        
        {/* Fleet Utilization */}
        <div className="bg-charcoal border border-charcoal-light/20 rounded-xl p-4 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Fleet Utilization</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-white">75%</span>
            <span className="text-xs text-slate-400">On Duty</span>
          </div>
          <div className="w-full bg-charcoal-light/30 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gold h-full rounded-full" style={{ width: '75%' }} />
          </div>
          <span className="text-[10px] text-slate-500 block">3 active trips out of 4 allocated slots</span>
        </div>

        {/* Consolidated Billing */}
        <div className="bg-charcoal border border-charcoal-light/20 rounded-xl p-4 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Consolidated Billing</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">R 20,997</span>
            <span className="text-[10px] text-slate-400 font-bold">ZAR</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Monthly recurrence • Autopay Enabled</span>
        </div>

        {/* VAT Invoice Downloads */}
        <div className="bg-charcoal border border-charcoal-light/20 rounded-xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Consolidated Billing & Invoices</span>
          
          <div className="flex items-center justify-between border-t border-charcoal-light/10 pt-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-gold-light" />
              <span className="font-mono text-slate-300">INV-2026-06</span>
            </div>
            <button className="text-gold hover:text-gold-light font-bold flex items-center space-x-1">
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

      </div>

      {/* Driver Roster Table */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
          <Users className="w-4 h-4 text-gold" />
          <span>Driver Roster & Allocations</span>
        </span>

        <div className="overflow-x-auto border border-charcoal-light/20 rounded-xl bg-charcoal/30">
          <table className="w-full text-left text-xs divide-y divide-charcoal-light/20">
            <thead className="bg-charcoal/80 text-[10px] text-slate-400 uppercase tracking-widest font-black">
              <tr>
                <th className="px-4 py-3">Driver Details</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Active Allocation</th>
                <th className="px-4 py-3">Trip Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-light/10">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-charcoal/20 transition-all">
                  <td className="px-4 py-3">
                    <span className="font-bold text-white block">{driver.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{driver.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-100">{driver.score}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        driver.tier === TrustTier.DIAMOND ? 'bg-gold/10 text-gold border border-gold/20' :
                        driver.tier === TrustTier.PLATINUM ? 'bg-slate-300/10 text-slate-200' :
                        driver.tier === TrustTier.GOLD ? 'bg-gold-dark/10 text-gold-dark' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {driver.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{driver.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${driver.statusColor}`}>
                      {driver.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
