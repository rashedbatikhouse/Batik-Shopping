import React from 'react';
import {
  TrendingUp,
  Shirt,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  MessageCircle,
  Smartphone,
  ArrowRight,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Order, Product } from '../types/index.ts';
import { ActiveTab } from './Navbar.tsx';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  todayOrdersCount: number;
  pendingOrdersCount: number;
  confirmedOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingHandoffs: number;
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentOrders: Order[];
  products: Product[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectOrder: (order: Order) => void;
  activeModelName?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  recentOrders,
  products,
  setActiveTab,
  onSelectOrder,
  activeModelName = 'Gemini 3.8 Flash',
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner with Batik Motif Aesthetic */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ghorer Shopping AI Sales &amp; Order Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            স্বাগতম! Ghorer Shopping সেন্ট্রাল ম্যানেজমেন্ট হাব
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            ফেসবুক মেসেঞ্জারে জেনুইন সেলস এজেন্টের মতো কাস্টমারের সাথে কথা বলে, ডাটাবেজ থেকে সঠিক বাটিক তথ্য যাচাই করে,
            ফাইনাল সামারি দেখিয়ে সুস্পষ্ট কনফার্মেশন নেওয়ার পর স্বয়ংক্রিয়ভাবে হোয়াটসঅ্যাপ কমিউনিটির <strong>Group 2 — Order Notification Group</strong>-এ পাঠায়।
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('messenger')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>মেসেঞ্জার AI চ্যাট টেস্ট করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="inline-flex items-center space-x-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ গ্রুপ ফিড (১ ও ২)</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Shirt className="w-4 h-4" />
              <span>প্রোডাক্ট ক্যাটালগ ({stats.totalProducts})</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRD Metrics Grid (Section 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট বিক্রয় রেভিনিউ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">৳{stats.totalRevenue.toLocaleString()}</span>
            <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">সফল ডেলিভারি ও কনফার্মড</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট বাটিক প্রোডাক্ট</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.totalProducts}</span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">{stats.activeProducts} টি একটিভ স্টকে</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট অর্ডার</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.totalOrders}</span>
            <span className="block text-[11px] text-blue-600 font-medium mt-0.5">আজকে নতুন: {stats.todayOrdersCount} টি</span>
          </div>
        </div>

        {/* Confirmed Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">কনফার্মড অর্ডার</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.confirmedOrdersCount}</span>
            <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">WA গ্রুপ ২-এ প্রেরিত</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">পেন্ডিং অর্ডার</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.pendingOrdersCount}</span>
            <span className="block text-[11px] text-amber-600 font-medium mt-0.5">কনফার্মেশনের অপেক্ষায়</span>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ডেলিভারড</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.deliveredOrdersCount}</span>
            <span className="block text-[11px] text-teal-600 font-medium mt-0.5">ক্যাশ অন ডেলিভারি সম্পন্ন</span>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ক্যান্সেলড</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.cancelledOrdersCount}</span>
            <span className="block text-[11px] text-rose-600 font-medium mt-0.5">স্টক রিস্টোর করা হয়েছে</span>
          </div>
        </div>

        {/* Human Support Handoffs */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">হিউম্যান সাপোর্ট কল</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.pendingHandoffs}</span>
            <span className="block text-[11px] text-purple-600 font-medium mt-0.5">অ্যাডমিনের উত্তরের অপেক্ষায়</span>
          </div>
        </div>
      </div>

      {/* Architecture Visual Pipeline (PRD Section 40) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>সিস্টেম লাইভ আর্কিটেকচার ফ্লো (Facebook Messenger ➔ AI Agent ➔ WhatsApp Community)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">১. কাস্টমার</div>
            <p className="text-xs text-slate-700 mt-1 font-medium">Facebook Page Messenger</p>
            <span className="text-[10px] text-slate-500">ইনকোয়ারি বা অর্ডার টেক্সট</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">২. AI সেলস এজেন্ট</div>
            <p className="text-xs text-slate-700 mt-1 font-bold truncate">{activeModelName}</p>
            <span className="text-[10px] text-slate-500">ন্যাচারাল বাংলা ও কন্ট্রোলড টুলস</span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">৩. ডাটাবেজ ট্রুথ</div>
            <p className="text-xs text-slate-700 mt-1 font-medium">MySQL Product Table</p>
            <span className="text-[10px] text-slate-500">জিরো হ্যালুসিনেশন রুলস</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">৪. কনফার্মেশন</div>
            <p className="text-xs text-slate-700 mt-1 font-medium">Explicit Approval</p>
            <span className="text-[10px] text-slate-500">সামারি দেখিয়ে সম্মতি বাধ্যতামূলক</span>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">৫. হোয়াটসঅ্যাপ</div>
            <p className="text-xs text-slate-700 mt-1 font-medium">Group 2: Orders</p>
            <span className="text-[10px] text-slate-500">ছবিসহ নোটিফিকেশন ডিসপ্যাচ</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Catalog Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm text-slate-900">সাম্প্রতিক কনফার্মড অর্ডার</h3>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো অর্ডার পাওয়া যায়নি। মেসেঞ্জার AI চ্যাটে নতুন অর্ডার টেস্ট করুন।
              </div>
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {order.items[0]?.image_url ? (
                        <img
                          src={order.items[0].image_url}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          বাটিক
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-900">{order.order_id}</span>
                        <span className="text-[11px] text-slate-500 font-medium">({order.customer_name})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                        {order.items.map((i) => `${i.product_name} (${i.color} x${i.quantity})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs text-slate-900">৳{order.grand_total}</span>
                    <div className="flex items-center justify-end space-x-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] font-semibold text-emerald-700">{order.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Featured Products Quick Stock Check */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center space-x-2">
                <Shirt className="w-4 h-4 text-slate-600" />
                <span>বাটিক স্টক অবস্থা</span>
              </h3>
              <button
                onClick={() => setActiveTab('products')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                ম্যানেজ করুন
              </button>
            </div>

            <div className="space-y-3">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={p.images[0]?.image_url}
                      alt={p.product_name}
                      className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{p.product_name}</p>
                      <span className="text-[11px] text-slate-500 font-mono">{p.product_id}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.stock > 5
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.stock > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.stock} পিস
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>WhatsApp Community Command:</strong> হোয়াটসঅ্যাপে <code>/stock GS-BTK-01 45</code> লিখে পাঠালে স্বয়ংক্রিয়ভাবে স্টক আপডেট হয়ে যাবে।
          </div>
        </div>
      </div>
    </div>
  );
};
