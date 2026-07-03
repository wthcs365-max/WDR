import { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  PlusCircle, 
  DollarSign, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  ClipboardList, 
  User,
  Search,
  Filter,
  MoreVertical,
  Car,
  Clock,
  Briefcase,
  ShieldCheck,
  Calendar,
  Download,
  AlertCircle
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  rentalRate: number;
  retailPrice: number;
  status: 'available' | 'rented' | 'maintenance';
  tbyb: boolean;
  verified: boolean;
  image: string;
}

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    make: 'BMW',
    model: '320i Sedan',
    year: 2023,
    vin: 'WBA5F31000K123456',
    rentalRate: 850,
    retailPrice: 650000,
    status: 'rented',
    tbyb: true,
    verified: true,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'v2',
    make: 'Toyota',
    model: 'Hilux 2.8GD-6',
    year: 2022,
    vin: 'AHTFR22G502987654',
    rentalRate: 1100,
    retailPrice: 780000,
    status: 'available',
    tbyb: true,
    verified: true,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'v3',
    make: 'Mercedes-Benz',
    model: 'C200 AMG',
    year: 2023,
    vin: 'WDD2050421F123456',
    rentalRate: 1250,
    retailPrice: 890000,
    status: 'available',
    tbyb: false,
    verified: true,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400'
  }
];

const MOCK_BOOKINGS = [
  {
    id: 'b1',
    renter: 'Sipho Gumede',
    trustScore: 842,
    kycStatus: 'Verified',
    vehicle: 'BMW 320i',
    duration: '5 Days',
    revenue: 4250,
    status: 'Pending Approval'
  },
  {
    id: 'b2',
    renter: 'Sarah Jenkins',
    trustScore: 715,
    kycStatus: 'Verified',
    vehicle: 'Toyota Hilux',
    duration: '3 Days',
    revenue: 3300,
    status: 'Approved'
  }
];

export function DealerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'analytics' | 'payouts' | 'leads' | 'profile'>('overview');
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  return (
    <div className="bg-charcoal-dark min-h-full text-slate-200">
      {/* Header */}
      <header className="border-b border-charcoal-light/30 bg-charcoal-dark/50 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-charcoal shadow-glow">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">Dealer Exchange</h2>
            <p className="text-xs text-slate-400 mt-1">Prestige Motors Sandton</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
            <ClipboardList className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full border-2 border-charcoal-dark"></span>
          </button>
          <div className="h-8 w-px bg-charcoal-light/30 mx-2"></div>
          <button className="flex items-center space-x-2 bg-charcoal-light/20 hover:bg-charcoal-light/40 px-3 py-1.5 rounded-lg transition-all border border-charcoal-light/20">
            <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
              <User className="w-3.5 h-3.5 text-gold" />
            </div>
            <span className="text-xs font-bold text-white">Sales Mgr</span>
          </button>
        </div>
      </header>

      {/* Sub-navigation */}
      <nav className="flex px-6 border-b border-charcoal-light/20 bg-charcoal-dark/30 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'inventory', label: 'Inventory', icon: Car },
          { id: 'leads', label: 'Leads & Bookings', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'payouts', label: 'Financials', icon: DollarSign },
          { id: 'profile', label: 'Trust Profile', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'text-gold border-gold' 
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="p-6 space-y-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'inventory' && <InventoryTab onAddVehicle={() => setShowAddVehicle(true)} />}
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'payouts' && <PayoutsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>

      {/* Add Vehicle Modal Overlay */}
      {showAddVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-charcoal-dark/90 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-charcoal border border-charcoal-light/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-charcoal-light/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <PlusCircle className="text-gold w-6 h-6" />
                <span>Add New Inventory</span>
              </h3>
              <button onClick={() => setShowAddVehicle(false)} className="text-slate-400 hover:text-white">
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Make</label>
                  <input type="text" placeholder="e.g. BMW" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</label>
                  <input type="text" placeholder="e.g. 320i Sedan" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year</label>
                  <input type="number" placeholder="2024" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">VIN</label>
                  <input type="text" placeholder="17-digit VIN" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rental Rate (ZAR/Day)</label>
                  <input type="number" placeholder="0" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors text-gold font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Retail Price (ZAR)</label>
                  <input type="number" placeholder="0" className="w-full bg-charcoal-dark border border-charcoal-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-4 border-t border-charcoal-light/10">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="w-5 h-5 rounded bg-charcoal-dark border-charcoal-light/30 text-gold focus:ring-gold" />
                  <span className="text-sm font-bold text-slate-300">Enable Try-Before-You-Buy (TBYB)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="w-5 h-5 rounded bg-charcoal-dark border-charcoal-light/30 text-gold focus:ring-gold" />
                  <span className="text-sm font-bold text-slate-300">WDR Verified Seal Request</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-charcoal-light/30 rounded-2xl p-10 flex flex-col items-center justify-center space-y-3 hover:border-gold/30 transition-colors bg-charcoal-dark/20">
                <PlusCircle className="w-10 h-10 text-slate-500" />
                <p className="text-sm text-slate-400 font-medium">Drag & drop vehicle photos or <span className="text-gold underline cursor-pointer">browse</span></p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">High-res PNG/JPG, max 5MB per file</p>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal-light/20 bg-charcoal-dark/50 flex justify-end space-x-4">
              <button onClick={() => setShowAddVehicle(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button className="bg-gold text-charcoal px-8 py-2.5 rounded-xl text-sm font-extrabold shadow-glow hover:scale-[1.02] transition-transform active:scale-[0.98]">Add to Inventory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: 'R 142,500', sub: '+12.4% vs last month', icon: DollarSign, color: 'text-gold' },
          { label: 'Active Rentals', value: '28', sub: '82% Utilization', icon: Car, color: 'text-emerald-400' },
          { label: 'Pending Requests', value: '14', sub: '3 Urgent (High Trust)', icon: Clock, color: 'text-amber-400' },
          { label: 'Purchase Leads', value: '9', sub: 'TBYB Conversions', icon: Users, color: 'text-blue-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-charcoal-light/10 border border-charcoal-light/20 rounded-2xl p-5 hover:border-gold/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-charcoal-dark border border-charcoal-light/20 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</h4>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-[10px] text-slate-400 font-medium">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ClipboardList className="text-gold w-5 h-5" />
              <span>Priority Booking Requests</span>
            </h3>
            <button className="text-xs text-gold font-bold hover:underline">View All</button>
          </div>

          <div className="space-y-4">
            {MOCK_BOOKINGS.map((booking) => (
              <div key={booking.id} className="bg-charcoal border border-charcoal-light/20 rounded-2xl p-4 flex items-center justify-between hover:bg-charcoal-light/5 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-charcoal-dark border-2 border-gold/30 flex items-center justify-center font-bold text-white overflow-hidden">
                      {booking.renter.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center border-2 border-charcoal text-[8px] font-extrabold text-charcoal">
                      9.2
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{booking.renter}</span>
                      <span className="bg-gold/10 text-gold text-[9px] font-bold px-1.5 py-0.5 rounded border border-gold/20">Trust: {booking.trustScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{booking.vehicle}</span>
                      <span className="text-slate-600">•</span>
                      <span>{booking.duration}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-bold">R {booking.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 rounded-xl border border-charcoal-light/30 text-xs font-bold text-slate-400 hover:text-white hover:bg-charcoal-light/20 transition-all">
                    Reject
                  </button>
                  <button className="px-6 py-2 rounded-xl bg-gold text-charcoal text-xs font-extrabold shadow-glow hover:scale-[1.02] transition-transform active:scale-[0.98]">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <PieChart className="text-gold w-5 h-5" />
            <span>Inventory Health</span>
          </h3>
          <div className="bg-charcoal border border-charcoal-light/20 rounded-3xl p-6 aspect-square flex flex-col items-center justify-center relative">
            {/* Simulated Chart */}
            <div className="w-48 h-48 rounded-full border-[16px] border-gold border-r-emerald-500 border-b-amber-500 relative flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">42</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Units</div>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 w-full">
              {[
                { label: 'Available', value: '18', color: 'bg-gold' },
                { label: 'Rented', value: '12', color: 'bg-emerald-500' },
                { label: 'TBYB Flow', value: '8', color: 'bg-amber-500' },
                { label: 'Service', value: '4', color: 'bg-charcoal-light/40' },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</span>
                  <span className="text-[10px] text-white font-bold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryTab({ onAddVehicle }: { onAddVehicle: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Active Stock Inventory</h3>
          <p className="text-xs text-slate-400">Manage your rental and retail fleet</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-charcoal border border-charcoal-light/20 rounded-xl overflow-hidden p-1">
            <button className="px-3 py-1.5 bg-charcoal-light/20 text-white rounded-lg text-xs font-bold">List View</button>
            <button className="px-3 py-1.5 text-slate-500 rounded-lg text-xs font-bold hover:text-slate-300">Grid</button>
          </div>
          <button onClick={onAddVehicle} className="bg-gold text-charcoal px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-glow flex items-center space-x-2">
            <PlusCircle className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-charcoal-light/5 border border-charcoal-light/10 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by VIN, Model or Plate..." className="w-full bg-charcoal border border-charcoal-light/30 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors" />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-charcoal border border-charcoal-light/20 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-charcoal border border-charcoal-light/20 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-charcoal border border-charcoal-light/20 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-charcoal-light/10 border-b border-charcoal-light/20">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vehicle Details</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pricing (Rental/Retail)</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TBYB</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-light/10">
            {MOCK_VEHICLES.map((v) => (
              <tr key={v.id} className="hover:bg-charcoal-light/5 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-4">
                    <img src={v.image} alt={v.model} className="w-16 h-10 object-cover rounded-lg border border-charcoal-light/20 shadow-lg" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{v.make} {v.model}</span>
                        {v.verified && <CheckCircle className="w-3 h-3 text-gold" />}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{v.vin}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div>
                    <div className="text-sm font-bold text-gold">R {v.rentalRate}/day</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Retail: R {v.retailPrice.toLocaleString()}</div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    v.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    v.status === 'rented' ? 'bg-gold/10 text-gold border border-gold/20' : 
                    'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${v.tbyb ? 'bg-gold' : 'bg-charcoal-light/30'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${v.tbyb ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadsTab() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Leads & CRM Pipeline</h3>
          <p className="text-xs text-slate-400">Convert renters into retail owners</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Inquiry', count: 12, color: 'bg-slate-500' },
          { label: 'Active Rental', count: 24, color: 'bg-emerald-500' },
          { label: 'TBYB Trial', count: 8, color: 'bg-gold' },
          { label: 'Finance Prep', count: 3, color: 'bg-blue-500' },
        ].map((stage, i) => (
          <div key={i} className="bg-charcoal border border-charcoal-light/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stage.label}</span>
              <span className="text-xl font-bold text-white">{stage.count}</span>
            </div>
            <div className="h-1 w-full bg-charcoal-dark rounded-full overflow-hidden">
              <div className={`h-full ${stage.color}`} style={{ width: `${(stage.count / 40) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-charcoal border border-charcoal-light/20 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 border-dashed opacity-60">
        <Users className="w-12 h-12 text-slate-500" />
        <div className="text-center">
          <p className="text-white font-bold">CRM Integration View</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">This section would contain the detailed Kanban pipeline for purchase leads originating from rentals.</p>
        </div>
        <button className="text-xs text-gold font-bold hover:underline">Connect Salesforce/Hubspot</button>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Performance Insights</h3>
          <p className="text-xs text-slate-400">Data-driven fleet management</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="bg-charcoal border border-charcoal-light/30 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-gold">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
          <button className="bg-gold/10 text-gold px-4 py-2 rounded-xl text-xs font-bold border border-gold/20 flex items-center space-x-2">
            <Download className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-charcoal border border-charcoal-light/20 rounded-3xl p-6 h-80 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-white">Revenue Growth</h4>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gold"></div>
                <span>Rental</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>TBYB Conv.</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between space-x-3 px-4">
            {[45, 62, 58, 84, 75, 92, 100, 88, 95, 110, 105, 120].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-gold/10 rounded-t-lg relative group-hover:bg-gold/20 transition-all" style={{ height: `${h}%` }}>
                  <div className="absolute inset-x-0 bottom-0 bg-gold rounded-t-lg transition-all" style={{ height: '70%' }}></div>
                  <div className="absolute inset-x-0 top-0 bg-emerald-500 rounded-t-lg opacity-40" style={{ height: '30%' }}></div>
                </div>
                <span className="text-[8px] text-slate-500 mt-2 font-bold">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-charcoal border border-charcoal-light/20 rounded-3xl p-6 flex flex-col">
          <h4 className="text-sm font-bold text-white mb-6">Lead Funnel Conversion</h4>
          <div className="flex-1 flex flex-col justify-between">
            {[
              { label: 'Direct Renters', val: '1,240', pct: 100, color: 'bg-charcoal-light/20' },
              { label: 'Purchase Interest', val: '450', pct: 40, color: 'bg-gold/40' },
              { label: 'Finance Apps', val: '120', pct: 15, color: 'bg-gold/70' },
              { label: 'Retail Sales', val: '42', pct: 8, color: 'bg-gold' },
            ].map((step, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-500">{step.label}</span>
                  <span className="text-white">{step.val}</span>
                </div>
                <div className="h-4 w-full bg-charcoal-dark rounded-lg overflow-hidden border border-charcoal-light/10">
                  <div className={`h-full ${step.color} transition-all duration-1000`} style={{ width: `${step.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-charcoal border border-charcoal-light/20 rounded-3xl p-6">
          <h4 className="text-sm font-bold text-white mb-6">Top Performing Stock</h4>
          <div className="space-y-4">
            {[
              { vehicle: 'BMW 320i Sedan', util: '94%', rev: 'R 25,500', trend: 'up' },
              { vehicle: 'Toyota Hilux 2.8GD-6', util: '88%', rev: 'R 31,400', trend: 'up' },
              { vehicle: 'VW Polo Hatch', util: '76%', rev: 'R 12,800', trend: 'down' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-charcoal-dark/40 border border-charcoal-light/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-bold text-xs">{i+1}</div>
                  <div>
                    <div className="text-xs font-bold text-white">{item.vehicle}</div>
                    <div className="text-[10px] text-slate-500">{item.util} Utilization</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{item.rev}</div>
                  <div className={`text-[10px] font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.trend === 'up' ? '▲ 8.2%' : '▼ 3.1%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-charcoal border border-charcoal-light/20 rounded-3xl p-6 flex flex-col items-center justify-center">
            <PieChart className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-sm font-bold text-slate-400">Advanced Heatmap & Telematics Insights</p>
            <button className="mt-4 text-xs text-gold font-bold px-4 py-2 rounded-xl border border-gold/20">Upgrade to Pro Analytics</button>
        </div>
      </div>
    </div>
  );
}

function PayoutsTab() {
  return (
    <div className="space-y-8">
       <div className="bg-gradient-to-br from-gold/20 to-charcoal-light/10 border border-gold/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Available Liquidity</h4>
            <div className="text-4xl font-black text-white">R 84,250.00</div>
            <p className="text-xs text-slate-400">Next scheduled payout: <span className="text-white font-bold">25 June 2024</span></p>
          </div>
          <div className="flex flex-col space-y-3">
            <button className="bg-gold text-charcoal px-8 py-3 rounded-2xl text-sm font-black shadow-glow-gold hover:scale-[1.02] transition-all flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Request Instant Payout</span>
            </button>
            <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-bold">1.5% Acceleration Fee Applies</p>
          </div>
        </div>
        <DollarSign className="absolute -right-8 -bottom-8 w-64 h-64 text-gold/5 rotate-12" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Earnings (YTD)', value: 'R 842,000', icon: TrendingUp },
          { label: 'Pending Settlement', value: 'R 12,450', icon: Clock },
          { label: 'Avg. Revenue / Unit', value: 'R 18,200', icon: BarChart3 },
        ].map((stat, i) => (
          <div key={i} className="bg-charcoal border border-charcoal-light/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-xl bg-charcoal-dark border border-charcoal-light/20 text-slate-400">
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <Calendar className="text-gold w-4 h-4" />
          <span>Transaction Ledger</span>
        </h4>
        <div className="bg-charcoal border border-charcoal-light/20 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-charcoal-light/10 border-b border-charcoal-light/20">
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Reference / ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-light/10 text-slate-300">
              {[
                { ref: 'WDR-TRX-8291', date: '18 Jun 2024', vehicle: 'BMW 320i', amount: 'R 4,250', status: 'Pending' },
                { ref: 'WDR-TRX-8288', date: '16 Jun 2024', vehicle: 'Toyota Hilux', amount: 'R 3,300', status: 'Settled' },
                { ref: 'WDR-TRX-8275', date: '12 Jun 2024', vehicle: 'BMW 320i', amount: 'R 8,500', status: 'Settled' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-charcoal-light/5 transition-colors">
                  <td className="px-6 py-4 font-mono">{row.ref}</td>
                  <td className="px-6 py-4">{row.date}</td>
                  <td className="px-6 py-4 font-bold">{row.vehicle}</td>
                  <td className="px-6 py-4 font-bold text-white">{row.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter ${
                      row.status === 'Settled' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gold/10 text-gold border border-gold/20'
                    }`}>
                      {row.status}
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
}

function ProfileTab() {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-8">
        <div className="bg-charcoal border border-charcoal-light/20 rounded-3xl p-8 flex items-center space-x-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl border-4 border-gold/30 bg-charcoal-dark flex items-center justify-center overflow-hidden">
               <Briefcase className="w-16 h-16 text-gold opacity-50" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gold rounded-2xl flex flex-col items-center justify-center text-charcoal border-4 border-charcoal shadow-xl">
              <span className="text-[10px] font-black leading-none uppercase">Tier</span>
              <span className="text-lg font-black leading-none">A+</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-2xl font-bold text-white">Prestige Motors Sandton</h3>
              <div className="bg-gold/10 text-gold px-2 py-1 rounded text-[10px] font-bold border border-gold/20">VERIFIED DEALER</div>
            </div>
            <p className="text-sm text-slate-400 mb-6 max-w-md">Professional luxury vehicle dealership and WTH Platinum Partner since 2022. Expert in rental-to-retail conversion.</p>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Merchant Score</div>
                <div className="text-xl font-bold text-white">942 / 1000</div>
              </div>
              <div className="w-px h-8 bg-charcoal-light/20"></div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Response Time</div>
                <div className="text-xl font-bold text-white">&lt; 15 mins</div>
              </div>
              <div className="w-px h-8 bg-charcoal-light/20"></div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Success Rate</div>
                <div className="text-xl font-bold text-white">99.2%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2 px-2">
            <TrendingUp className="text-gold w-4 h-4" />
            <span>Performance Drivers</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Maintenance Records', pct: 98, color: 'bg-emerald-500' },
              { label: 'Vehicle Cleanliness', pct: 95, color: 'bg-emerald-500' },
              { label: 'KYC Accuracy', pct: 100, color: 'bg-gold' },
              { label: 'Lead Conversion', pct: 12, color: 'bg-amber-500' },
            ].map((driver, i) => (
              <div key={i} className="bg-charcoal border border-charcoal-light/20 rounded-2xl p-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                  <span className="text-slate-400">{driver.label}</span>
                  <span className="text-white">{driver.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-charcoal-dark rounded-full overflow-hidden">
                  <div className={`h-full ${driver.color}`} style={{ width: `${driver.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-b from-charcoal to-charcoal-dark border border-charcoal-light/20 rounded-3xl p-6">
          <h4 className="text-sm font-bold text-white mb-6">B2B Rewards & Tiers</h4>
          <div className="space-y-6">
             <div className="relative pl-10 border-l-2 border-gold/30 pb-6">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-gold flex items-center justify-center border-4 border-charcoal">
                  <CheckCircle className="w-2 h-2 text-charcoal" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Silver Tier</div>
                  <p className="text-[10px] text-slate-500 mt-1">Base commission rates and standard listing placement.</p>
                </div>
             </div>
             <div className="relative pl-10 border-l-2 border-gold pb-6">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-gold flex items-center justify-center border-4 border-charcoal">
                  <CheckCircle className="w-2 h-2 text-charcoal" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gold">Gold Tier (Current)</div>
                  <p className="text-[10px] text-slate-300 mt-1">Reduced 12% commission, "Verified" badge, Priority Support.</p>
                </div>
             </div>
             <div className="relative pl-10 border-l-2 border-charcoal-light/30">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-charcoal-dark flex items-center justify-center border-4 border-charcoal"></div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Platinum Tier</div>
                  <p className="text-[10px] text-slate-600 mt-1">10% Commission, Homepage Featured stock, Direct API integrations.</p>
                  <div className="mt-2 text-[10px] font-bold text-gold">Need 4 more TBYB conversions</div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5">
           <div className="flex items-center space-x-2 text-gold mb-2">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Compliance Status</span>
           </div>
           <p className="text-[11px] text-slate-400 leading-relaxed">
             FICA & Dealer License verified. Next documentation review due in <span className="text-white font-bold">42 days</span>.
           </p>
        </div>
      </div>
    </div>
  );
}
