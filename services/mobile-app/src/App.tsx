import { useState } from 'react';
import { ShieldCheck, Cpu, Layers, HelpCircle, Settings, Truck, Code, Eye, Laptop, Briefcase } from 'lucide-react';
import { TrustDashboard } from './components/TrustDashboard';
import { Onboarding } from './components/Onboarding';
import { VehicleListing } from './components/VehicleListing';
import { WDRShieldUpsell } from './components/WDRShieldUpsell';
import { VaaSPlans } from './components/VaaSPlans';
import { VaaSDashboard } from './components/VaaSDashboard';
import { VaaSBooking } from './components/VaaSBooking';
import { VaaSAdmin } from './components/VaaSAdmin';
import { DealerDashboard } from './components/DealerDashboard';
import { TrustTier } from '@wdr/shared-types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'onboarding' | 'vehicles' | 'shield' | 'vaas-plans' | 'vaas-dashboard' | 'vaas-booking' | 'vaas-admin' | 'dealer-dashboard'>('vaas-plans');
  const [trustScore, setTrustScore] = useState(850);
  const [isKycVerified, setIsKycVerified] = useState(true);
  const [isWaiverActive, setIsWaiverActive] = useState(true);

  // VaaS subscription states
  const [selectedPlan, setSelectedPlan] = useState<'flex' | 'plus' | 'business' | null>('plus');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [kmUsed, setKmUsed] = useState(1240);
  const [activeVehicle, setActiveVehicle] = useState<{ id: string; make: string; model: string; image: string; rate: number } | null>({
    id: '1',
    make: 'BMW',
    model: '320i',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400',
    rate: 850
  });

  const [selectedBookingVehicle, setSelectedBookingVehicle] = useState<{ id: string; make: string; model: string; image: string; rate: number } | null>(null);

  // Derive Trust Tier from score
  const getTierFromScore = (score: number): TrustTier => {
    if (score >= 800) return TrustTier.DIAMOND;
    if (score >= 700) return TrustTier.PLATINUM;
    if (score >= 600) return TrustTier.GOLD;
    if (score >= 500) return TrustTier.SILVER;
    return TrustTier.BRONZE;
  };

  const currentTier = getTierFromScore(trustScore);

  // Plan limits helper
  const getPlanLimits = (plan: 'flex' | 'plus' | 'business' | null) => {
    switch (plan) {
      case 'flex': return { limit: 500 };
      case 'business': return { limit: 2000 };
      default: return { limit: 1000 };
    }
  };

  const planLimits = getPlanLimits(selectedPlan);

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
      case 'vaas-plans':
        return {
          status: "success",
          billingCycle: "monthly",
          plans: [
            { id: "flex-sub", name: "Flex", baseRateZar: 2999, limitKm: 500 },
            { id: "plus-sub", name: "Plus", baseRateZar: 4999, limitKm: 1000, recommended: true },
            { id: "business-sub", name: "Business", baseRateZar: 6999, limitKm: 2000 }
          ],
          trustDiscountApplied: `${Math.min(30, Math.max(0, Math.floor((trustScore - 600) / 10)))}%`
        };
      case 'vaas-dashboard':
        return {
          status: "success",
          subscription: {
            id: "sub_vaas_12894",
            plan: selectedPlan,
            status: subscriptionStatus,
            mileageLimitKm: planLimits.limit,
            mileageUsedKm: kmUsed,
            activeVehicleId: activeVehicle?.id || null
          }
        };
      case 'vaas-booking':
        return {
          status: "quote",
          subscriptionId: "sub_vaas_12894",
          vehicleId: selectedBookingVehicle?.id || activeVehicle?.id,
          depositRequiredZar: 0,
          chargeZar: 0,
          insuranceTier: "premium"
        };
      case 'vaas-admin':
        return {
          status: "success",
          fleetOwnerId: "sme_corp_4482",
          utilization: "75%",
          consolidatedBillingZar: 20997,
          approvedDriversCount: 4
        };
      case 'dealer-dashboard':
        return {
          status: "success",
          dealerId: "prestige_sandton_992",
          merchantScore: 942,
          activeRentals: 28,
          pendingPayoutZar: 84250,
          inventoryUnits: 42
        };
    }
  };

  // Switch to Booking for a vehicle
  const handleSelectBookingVehicle = (vehicle: { id: string; make: string; model: string; image: string; rate: number }) => {
    setSelectedBookingVehicle(vehicle);
    setActiveTab('vaas-booking');
  };

  // Confirm booking trip
  const handleConfirmTrip = () => {
    if (selectedBookingVehicle) {
      setActiveVehicle(selectedBookingVehicle);
      setSelectedBookingVehicle(null);
    }
    setActiveTab('vaas-dashboard');
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

          {/* Renter Consumer App Flow */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Consumer App Flow</span>
            </span>
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

          {/* VaaS Subscription Flow */}
          <div className=\"space-y-1.5 pt-2\">
            <span className=\"text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1\">
              <Truck className=\"w-3.5 h-3.5 text-gold\" />
              <span>VaaS Subscriber Flow</span>
            </span>
            <button
              onClick={() => setActiveTab('vaas-plans')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'vaas-plans' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className=\"w-4 h-4 text-gold\" />
              <span>5. VaaS Plans Selection</span>
            </button>
            <button
              onClick={() => setActiveTab('vaas-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'vaas-dashboard' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Cpu className=\"w-4 h-4 text-gold\" />
              <span>6. VaaS Dashboard</span>
            </button>
            <button
              onClick={() => {
                setSelectedBookingVehicle({
                  id: '1',
                  make: 'BMW',
                  model: '320i',
                  image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400',
                  rate: 850
                });
                setActiveTab('vaas-booking');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'vaas-booking' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck className=\"w-4 h-4 text-gold\" />
              <span>7. One-Tap VaaS Booking</span>
            </button>
            <button
              onClick={() => setActiveTab('vaas-admin')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'vaas-admin' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Laptop className=\"w-4 h-4 text-gold\" />
              <span>8. VaaS Business Admin</span>
            </button>
          </div>

          {/* B2B Dealer Flow */}
          <div className=\"space-y-1.5 pt-2\">
            <span className=\"text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1\">
              <Briefcase className=\"w-3.5 h-3.5 text-gold\" />
              <span>B2B Dealer Flow</span>
            </span>
            <button
              onClick={() => setActiveTab('dealer-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'dealer-dashboard' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Briefcase className=\"w-4 h-4 text-gold\" />
              <span>9. Dealer Exchange Dashboard</span>
            </button>
          </div>

          {/* Interactive Controls */}
          <div className=\"space-y-4 pt-4 border-t border-charcoal-light/20\">
            <span className=\"text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1\">
              <Settings className=\"w-3.5 h-3.5\" />
              <span>Score & State Controls</span>
            </span>

            <div className=\"space-y-1.5\">
              <div className=\"flex justify-between text-xs font-bold text-slate-300\">
                <span>Trust Score alpha:</span>
                <span className=\"text-gold\">{trustScore}</span>
              </div>
              <input
                type=\"range\"
                min=\"350\"
                max=\"980\"
                value={trustScore}
                onChange={(e) => setTrustScore(Number(e.target.value))}
                className=\"w-full h-1.5 bg-charcoal-light/40 rounded-lg appearance-none cursor-pointer accent-gold\"
              />
              <div className=\"flex justify-between text-[10px] text-slate-500\">
                <span>350 (Risky)</span>
                <span>980 (Perfect)</span>
              </div>
            </div>

            {/* Simulated mileage controls when active */}
            {activeTab === 'vaas-dashboard' && (
              <div className=\"space-y-1.5 pt-1\">
                <div className=\"flex justify-between text-xs font-bold text-slate-300\">
                  <span>Simulated Mileage:</span>
                  <span className=\"text-gold\">{kmUsed} km</span>
                </div>
                <input
                  type=\"range\"
                  min=\"0\"
                  max={planLimits.limit}
                  value={kmUsed}
                  onChange={(e) => setKmUsed(Number(e.target.value))}
                  className=\"w-full h-1.5 bg-charcoal-light/40 rounded-lg appearance-none cursor-pointer accent-gold\"
                />
              </div>
            )}

            {/* Simulated options */}
            <div className=\"space-y-2.5 pt-2\">
              <div className=\"flex items-center justify-between text-xs\">
                <span className=\"text-slate-400\">KYC Status Verified:</span>
                <input
                  type=\"checkbox\"
                  checked={isKycVerified}
                  onChange={(e) => setIsKycVerified(e.target.checked)}
                  className=\"w-4 h-4 rounded text-gold focus:ring-gold bg-charcoal border-charcoal-light\"
                />
              </div>
              <div className=\"flex items-center justify-between text-xs\">
                <span className=\"text-slate-400\">Shield Waiver Active:</span>
                <input
                  type=\"checkbox\"
                  checked={isWaiverActive}
                  onChange={(e) => setIsWaiverActive(e.target.checked)}
                  className=\"w-4 h-4 rounded text-gold focus:ring-gold bg-charcoal border-charcoal-light\"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Brand/Design System Specs */}
        <div className=\"pt-4 border-t border-charcoal-light/20 space-y-2\">
          <div className=\"bg-charcoal/40 p-3 rounded-xl border border-charcoal-light/20\">
            <span className=\"text-[9px] text-gold font-bold uppercase tracking-wider block mb-1\">Design System compliance</span>
            <div className=\"grid grid-cols-2 gap-1.5 text-[10px] text-slate-400\">
              <div>Primary: <span className=\"text-white font-mono font-semibold\">#1A2026</span></div>
              <div>Accent: <span className=\"text-gold font-mono font-semibold\">#C5A059</span></div>
              <div>Font: <span className=\"text-white font-semibold\">Inter</span></div>
              <div>Radius: <span className=\"text-white font-semibold\">12-16px</span></div>
            </div>
          </div>
          <span className=\"text-[9px] text-slate-600 block text-center\">WDR Sandbox v0.2.0 • South Africa</span>
        </div>
      </div>

      {/* CENTER WORKSPACE: Sleek Mobile framing view / Web Dashboard view */}
      <div className=\"flex-1 flex flex-col items-center justify-center bg-charcoal-dark/50 relative p-6 overflow-y-auto\">
        {activeTab === 'vaas-admin' || activeTab === 'dealer-dashboard' ? (
          /* For Business Admin & Dealer Web View, we render a wide Web Panel instead of a mobile device! */
          <div className=\"w-full max-w-5xl shadow-2xl transition-all duration-300\">
            {activeTab === 'vaas-admin' ? <VaaSAdmin /> : <DealerDashboard />}
          </div>
        ) : (
          /* Standard Sleek Mobile Device Frame */
          <div className=\"relative w-[360px] h-[720px] bg-charcoal-dark border-[10px] border-charcoal-light/80 rounded-[48px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-charcoal-light/25\">
            {/* Top Notch/Speaker */}
            <div className=\"absolute top-0 inset-x-0 h-6 bg-charcoal-light/80 z-50 flex items-center justify-center\">
              <div className=\"w-24 h-4 bg-charcoal-dark rounded-b-2xl flex items-center justify-center\">
                <div className=\"w-10 h-1 bg-slate-700 rounded-full\" />
              </div>
            </div>

            {/* Simulated content viewport */}
            <div className=\"flex-1 pt-6 overflow-hidden\">
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
                  onSelectVehicle={handleSelectBookingVehicle}
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
              {activeTab === 'vaas-plans' && (
                <VaaSPlans
                  score={trustScore}
                  onSelectPlan={(plan) => {
                    setSelectedPlan(plan);
                    setActiveTab('vaas-dashboard');
                  }}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              )}
              {activeTab === 'vaas-dashboard' && (
                <VaaSDashboard
                  kmUsed={kmUsed}
                  kmLimit={planLimits.limit}
                  activeVehicle={activeVehicle}
                  subscriptionStatus={subscriptionStatus}
                  onSwitchVehicle={() => {
                    // Switch vehicle triggers the vehicle browser/selector flow!
                    setActiveTab('vehicles');
                  }}
                  onTogglePause={() => {
                    setSubscriptionStatus(prev => prev === 'paused' ? 'active' : 'paused');
                  }}
                  onNavigateToPlans={() => setActiveTab('vaas-plans')}
                />
              )}
              {activeTab === 'vaas-booking' && (
                <VaaSBooking
                  vehicle={selectedBookingVehicle || activeVehicle}
                  onConfirm={handleConfirmTrip}
                  onCancel={() => setActiveTab('vaas-dashboard')}
                />
              )}
            </div>

            {/* Bottom Virtual Home Indicator bar */}
            <div className=\"h-4 bg-charcoal-dark/80 flex items-center justify-center pb-1\">
              <div className=\"w-28 h-1 bg-slate-500 rounded-full\" />
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: Simulated JSON API Response Log */}
      <div className=\"w-80 border-l border-charcoal-light/30 bg-charcoal-dark/95 p-5 flex flex-col justify-between overflow-y-auto\">
        <div className=\"space-y-4\">
          <span className=\"text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center space-x-1.5\">
            <Code className=\"w-4 h-4 text-gold\" />
            <span>Simulated API response log</span>
          </span>
          
          <div className=\"space-y-1\">
            <span className=\"text-[10px] text-slate-400 font-bold block\">ENDPOINT:</span>
            <span className=\"text-[11px] font-mono font-bold text-gold bg-charcoal/50 px-2 py-1 rounded block truncate\">
              {activeTab === 'dashboard' && 'GET /v1/trust/summary'}
              {activeTab === 'onboarding' && 'POST /v1/users/me/kyc'}
              {activeTab === 'vehicles' && 'GET /v1/vehicles'}
              {activeTab === 'shield' && 'POST /v1/trust/waiver/evaluate'}
              {activeTab === 'vaas-plans' && 'GET /v1/subscriptions/plans'}
              {activeTab === 'vaas-dashboard' && 'GET /v1/subscriptions/me'}
              {activeTab === 'vaas-booking' && 'POST /v1/subscriptions/me/book'}
              {activeTab === 'vaas-admin' && 'GET /v1/subscriptions/business/stats'}
              {activeTab === 'dealer-dashboard' && 'GET /v1/partner/dealer/summary'}
            </span>
          </div>

          <div className=\"flex-1 min-h-[300px]\">
            <span className=\"text-[10px] text-slate-400 font-bold block mb-1\">JSON RESPONSE BODY:</span>
            <pre className=\"bg-charcoal/40 border border-charcoal-light/20 p-3.5 rounded-xl font-mono text-[10px] text-emerald leading-relaxed overflow-x-auto h-[420px]\">
              {JSON.stringify(getApiResponseMock(), null, 2)}
            </pre>
          </div>
        </div>

        <div className=\"bg-charcoal/40 p-3.5 rounded-xl border border-charcoal-light/20\">
          <span className=\"text-[9px] text-slate-400 font-bold block mb-1\">Developer Notes:</span>
          <p className=\"text-[10px] text-slate-500 leading-relaxed\">
            Adjust score/mileage sliders to see real-time updates. The VaaS flow lets you select a plan, manage vehicle usage, and simulate SME fleet administration perfectly.
          </p>
        </div>
      </div>
    </div>
  );
}
