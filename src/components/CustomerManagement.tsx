import React, { useState } from 'react';
import { Users, Search, Phone, MapPin, ShoppingBag, Calendar, ExternalLink } from 'lucide-react';
import { Customer, Order } from '../types/index.ts';

interface CustomerManagementProps {
  customers: Customer[];
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  orders,
  onSelectOrder,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile_number.includes(search) ||
      (c.district && c.district.toLowerCase().includes(search.toLowerCase()))
  );

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customer_id === selectedCustomer.id ||
          o.mobile_number === selectedCustomer.mobile_number
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>কাস্টমার ডাটাবেজ ও পারচেজ হিস্টোরি</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মেসেঞ্জারে চ্যাট করা ও অর্ডার দেওয়া সম্মানিত গ্রাহকদের মেমোরি ও প্রোফাইল।
          </p>
        </div>

        <div className="text-xs text-slate-600 font-medium">
          মোট কাস্টমার: <strong className="text-slate-900 font-bold">{customers.length} জন</strong>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="কাস্টমারের নাম, ফোন নাম্বার বা জেলা দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো কাস্টমার ডাটা নেই</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            মেসেঞ্জারে কাস্টমার ইনবক্স করলে বা অর্ডার দিলে স্বয়ংক্রিয়ভাবে কাস্টমার প্রোফাইল তৈরি হবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Cards List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
            গ্রাহক তালিকা ({filteredCustomers.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                  selectedCustomer?.id === cust.id ? 'bg-amber-50/70 border-l-4 border-amber-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{cust.name}</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {cust.total_orders} টি অর্ডার
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-500">
                  <span className="font-mono">{cust.mobile_number}</span>
                  {cust.district && (
                    <>
                      <span>•</span>
                      <span>{cust.district}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Customer Detailed Profile & Order History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[580px] overflow-y-auto">
          {selectedCustomer ? (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {selectedCustomer.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{selectedCustomer.name}</h3>
                      <p className="text-xs text-slate-500 font-mono flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{selectedCustomer.mobile_number}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">মোট স্পেন্ড</span>
                    <span className="text-base font-extrabold text-amber-700">৳{selectedCustomer.total_spent}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">জেলা:</span>
                    <span className="font-medium text-slate-800">{selectedCustomer.district || 'ঢাকা'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ফেসবুক PSID:</span>
                    <span className="font-mono text-slate-800">{selectedCustomer.facebook_psid || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>অর্ডার হিস্টোরি ({customerOrders.length} টি)</span>
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {customerOrders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      এই কাস্টমারের কোনো পূর্ববর্তী অর্ডার পাওয়া যায়নি।
                    </div>
                  ) : (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => onSelectOrder(ord)}
                        className="p-3 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 font-mono">{ord.order_id}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ord.items.map((i) => `${i.product_name} (${i.color})`).join(', ')}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-slate-900">৳{ord.grand_total}</span>
                          <span className="block text-[10px] text-slate-400">
                            {new Date(ord.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              কাস্টমার নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
