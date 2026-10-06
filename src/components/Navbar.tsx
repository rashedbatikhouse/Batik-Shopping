import React from 'react';
import {
  Store,
  LayoutDashboard,
  Shirt,
  ShoppingBag,
  Users,
  MessageCircle,
  Smartphone,
  Headphones,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'customers'
  | 'messenger'
  | 'whatsapp'
  | 'handoff'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingHandoffsCount: number;
  confirmedOrdersCount: number;
  activeModelName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingHandoffsCount,
  confirmedOrdersCount,
  activeModelName = 'Gemini 3.8 Flash',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'products', label: 'প্রোডাক্ট ম্যানেজমেন্ট', icon: Shirt },
    {
      id: 'orders',
      label: 'অর্ডার লিস্ট',
      icon: ShoppingBag,
      badge: confirmedOrdersCount > 0 ? confirmedOrdersCount : undefined,
    },
    { id: 'customers', label: 'কাস্টমার', icon: Users },
    { id: 'messenger', label: 'মেসেঞ্জার AI চ্যাট', icon: MessageCircle, highlight: true },
    { id: 'whatsapp', label: 'হোয়াটসঅ্যাপ গ্রুপ (১ ও ২)', icon: Smartphone },
    {
      id: 'handoff',
      label: 'হিউম্যান সাপোর্ট',
      icon: Headphones,
      badge: pendingHandoffsCount > 0 ? pendingHandoffsCount : undefined,
      badgeColor: 'bg-amber-600',
    },
    { id: 'settings', label: 'সেটিংস ও ডাটাবেজ', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-900/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-rose-100 to-amber-100 bg-clip-text text-transparent">
                  Ghorer Shopping
                </span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                  AI Sales Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">বাটিক শপিং ও অটোমেটেড অর্ডার সিস্টেম</p>
            </div>
          </div>

          {/* Quick System Status Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <button
              onClick={() => setActiveTab('settings')}
              title="AI মডেল পরিবর্তন বা কনফিগার করতে ক্লিক করুন"
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-slate-700/60 cursor-pointer transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-medium">{activeModelName}</span>
              <span className="text-[10px] text-amber-400 underline font-normal ml-0.5">পরিবর্তন</span>
            </button>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">WA Community Ready</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">MySQL Schema</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-2 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/40'
                    : item.highlight
                    ? 'bg-slate-800/90 text-amber-300 hover:bg-slate-800 hover:text-white border border-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                      item.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
