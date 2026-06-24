import { useState } from 'react';
import { ShieldCheck, Cpu, Layers, HelpCircle, Code, Settings } from 'lucide-react';
import { TrustDashboard } from './components/TrustDashboard';
import { Onboarding } from './components/Onboarding';
import { VehicleListing } from './components/VehicleListing';
import { WDRShieldUpsell } from './components/WDRShieldUpsell';
import { TrustTier } from '@wdr/shared-types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'onboarding' | 'vehicles' | 'shield'>('dashboard');
  const [trustScore, setTrustScore] = useState(850);
  const [isKycVerified, setIsKycVerified] = useState(true);
  const [isWaiverActive, setIsWaiverActive] = useState(true);

  // Derive Trust Tier from score
  const getTierFromScore = (score: number): TrustTier => {
    if (score >= 800) return TrustTier.DIAMOND;
    if (score >= 700) return TrustTier.PLATINUM;
    if (score >= 600) return TrustTier.GOLD;
    if (score >= 500) return TrustTier.SILVER;
    return TrustTier.BRONZE;
  };

  const currentTier = getTierFromScore(trustScore);

  const getApiResponseMock = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          status: "success",
          data: {
            overallScore: trustScore,
            tier: currentTier,
            waiverEligible: trustScore >= 600,
            maxWaiverAmount: trustScore >= 800 ? 15000 : trustScore >= 700 ? 10000 : 5000,
            benefits: {
              depositWaiver: trustScore >= 600 ? "Active (Zero upfront deposit)" : "Not eligible (Requires Score > 600)",
              insuranceAdjustment: trustScore >= 800 ? "-20%" : trustScore >= 700 ? "-15%" : "-10%"
            }
          }
        };
      case 'onboarding':
        return {
          status: "pending",
          kycStatus: isKycVerified ? "VERIFIED" : "PENDING",
          documentType: "selfie",
          encryption: "AES-256-GCM",
          popiaCompliant: true
        };
      case 'vehicles':
        return {
          status: "success",
          data: [
            { id: "1", make: "BMW", model: "3 Series", ownershipType: "DEALER", dailyRateZar: 850, verified: true },
            { id: "2", make: "Toyota", model: "Hilux", ownershipType: "FLEET_OPERATOR", dailyRateZar: 1100, verified: true }
          ]
        };
      case 'shield':
        return {
          status: "success",
          waiverActive: isWaiverActive,
          trustAlphaScore: trustScore,
          traditionalDepositRequired: 8500,
          dailyShieldFeeZar: Math.round(120 * (1 - Math.min(50, Math.max(0, Math.floor((trustScore - 500) / 10))) / 100))
        };
    }
  };

  return (
    <div className="flex h-screen bg-charcoal-dark font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: Developer Control & Token Inspector */}
      <div className="w-80 border-r border-charcoal-light/30 bg-charcoal-dark/95 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center text-charcoal shadow-glow">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">WTH Drive Rentals</h1>
              <p className="text-[10px] text-gold font-bold uppercase tracking-wider">Dev Sandbox & Preview</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Screens</span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Cpu className="w-4 h-4" />
              <span>1. Trust Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'onboarding' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Biometric KYC</span>
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'vehicles' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>3. Verified Vehicle Listing</span>
            </button>
            <button
              onClick={() => setActiveTab('shield')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'shield' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>4. WDR Shield Upsell</span>
            </button>
          </div>

          {/* Interactive Controls */}
          <div className="space-y-4 pt-4 border-t border-charcoal-light/20">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1">
              <Settings className="w-3.5 h-3.5" />
              <span>Score & State Controls</span>
            </span>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Trust Score alpha:</span>
                <span className="text-gold">{trustScore}</span>
              </div>
              <input 
                type="range" 
                min="350" 
                max="980" 
                value={trustScore} 
                onChange={(e) => setTrustScore(Number(e.target.value))}
                className="w-full h-1.5 bg-charcoal-light/40 rounded-lg appearance-none cursor-pointer accent-gold"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>350 (Risky)</span>
                <span>980 (Perfect)</span>
              </div>
            </div>

            {/* Simulated options */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">KYC Status Verified:</span>
                <input 
                  type="checkbox" 
                  checked={isKycVerified} 
                  onChange={(e) => setIsKycVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold bg-charcoal border-charcoal-light"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Shield Waiver Active:</span>
                <input 
                  type="checkbox" 
                  checked={isWaiverActive} 
                  onChange={(e) => setIsWaiverActive(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold bg-charcoal border-charcoal-light"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Brand/Design System Specs */}
        <div className="pt-4 border-t border-charcoal-light/20 space-y-2">
          <div className="bg-charcoal/40 p-3 rounded-xl border border-charcoal-light/20">
            <span className="text-[9px] text-gold font-bold uppercase tracking-wider block mb-1">Design System compliance</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
              <div>Primary: <span className="text-white font-mono font-semibold">#1A2026</span></div>
              <div>Accent: <span className="text-gold font-mono font-semibold">#C5A059</span></div>
              <div>Font: <span className="text-white font-semibold">Inter</span></div>
              <div>Radius: <span className="text-white font-semibold">12-16px</span></div>
            </div>
          </div>
          <span className="text-[9px] text-slate-600 block text-center">WDR Sandbox v0.1.0 • South Africa</span>
        </div>
      </div>

      {/* CENTER WORKSPACE: Sleek Mobile framing view */}
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal-dark/50 relative p-6">
        {/* Sleek Mobile Device Frame */}
        <div className="relative w-[360px] h-[720px] bg-charcoal-dark border-[10px] border-charcoal-light/80 rounded-[48px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-charcoal-light/25">
          {/* Top Notch/Speaker */}
          <div className="absolute top-0 inset-x-0 h-6 bg-charcoal-light/80 z-50 flex items-center justify-center">
            <div className="w-24 h-4 bg-charcoal-dark rounded-b-2xl flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>

          {/* Simulated content viewport */}
          <div className="flex-1 pt-6 overflow-hidden">
            {activeTab === 'dashboard' && (
              <TrustDashboard 
                score={trustScore} 
                tier={currentTier} 
                waiverActive={isWaiverActive}
                onNavigateToShield={() => setActiveTab('shield')}
              />
            )}
            {activeTab === 'onboarding' && (
              <Onboarding 
                onOnboardingComplete={(status) => setIsKycVerified(status)}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'vehicles' && (
              <VehicleListing 
                onNavigateToDashboard={() => setActiveTab('dashboard')}
                onNavigateToShield={() => setActiveTab('shield')}
              />
            )}
            {activeTab === 'shield' && (
              <WDRShieldUpsell 
                score={trustScore} 
                waiverActive={isWaiverActive}
                onToggleWaiver={(status) => setIsWaiverActive(status)}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            )}
          </div>

          {/* Bottom Virtual Home Indicator bar */}
          <div className="h-4 bg-charcoal-dark/80 flex items-center justify-center pb-1">
            <div className="w-28 h-1 bg-slate-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Simulated JSON API Response Log */}
      <div className="w-80 border-l border-charcoal-light/30 bg-charcoal-dark/95 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1.5">
            <Code className="w-4 h-4 text-gold" />
            <span>Simulated API response log</span>
          </span>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">ENDPOINT:</span>
            <span className="text-[11px] font-mono font-bold text-gold bg-charcoal/50 px-2 py-1 rounded block truncate">
              {activeTab === 'dashboard' && 'GET /v1/trust/summary'}
              {activeTab === 'onboarding' && 'POST /v1/users/me/kyc'}
              {activeTab === 'vehicles' && 'GET /v1/vehicles'}
              {activeTab === 'shield' && 'POST /v1/trust/waiver/evaluate'}
            </span>
          </div>

          <div className="flex-1 min-h-[300px]">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">JSON RESPONSE BODY:</span>
            <pre className="bg-charcoal/40 border border-charcoal-light/20 p-3.5 rounded-xl font-mono text-[10px] text-emerald leading-relaxed overflow-x-auto h-[420px]">
              {JSON.stringify(getApiResponseMock(), null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-charcoal/40 p-3.5 rounded-xl border border-charcoal-light/20">
          <span className="text-[9px] text-slate-400 font-bold block mb-1">Developer Notes:</span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Change sliders or toggles in the left menu to simulate real API state updates. Fully integrated with shared <code className="text-gold bg-charcoal px-1 py-0.5 rounded font-mono">@wdr/shared-types</code> and design tokens.
          </p>
        </div>
      </div>

    </div>
  );
}
