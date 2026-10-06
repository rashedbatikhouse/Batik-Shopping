import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  RotateCcw,
  Smartphone,
  MapPin,
  Phone,
  FileText,
  Printer,
  X,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Order, OrderStatus } from '../types/index.ts';

interface OrderManagementProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onRefresh: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  selectedOrder,
  onSelectOrder,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRetryingWhatsApp, setIsRetryingWhatsApp] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);

  const statuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Returned',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      search === '' ||
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.mobile_number.includes(search) ||
      o.district.toLowerCase().includes(search.toLowerCase()) ||
      o.full_address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || `Admin updated status to ${newStatus}`,
          changed_by: 'Admin Dashboard',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSelectOrder(data.data);
        setStatusNote('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRetryWhatsAppNotification = async () => {
    if (!selectedOrder) return;
    setIsRetryingWhatsApp(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/retry-notification`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('WhatsApp Order Notification পুনরায় প্রেরণ করা হয়েছে!');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetryingWhatsApp(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">🟢 Confirmed</span>;
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">⏳ Pending</span>;
      case 'Processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">⚙️ Processing</span>;
      case 'Packed':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">📦 Packed</span>;
      case 'Shipped':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">🚚 Shipped</span>;
      case 'Delivered':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">✅ Delivered</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">❌ Cancelled</span>;
      case 'Returned':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">↩️ Returned</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <span>অর্ডার ম্যানেজমেন্ট ও স্ট্যাটাস ট্র্যাকিং</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মেসেঞ্জারে কাস্টমারের স্পষ্ট কনফার্মেশনের পর তৈরি হওয়া অর্ডারসমূহ এবং হোয়াটসঅ্যাপ নোটিফিকেশন হিস্টোরি।
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            সব ({orders.length})
          </button>
          {statuses.map((st) => {
            const count = orders.filter((o) => o.status.toLowerCase() === st.toLowerCase()).length;
            const active = statusFilter.toLowerCase() === st.toLowerCase();
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="অর্ডার আইডি (GS-ORD-1001), কাস্টমারের নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">অর্ডার আইডি</th>
                <th className="px-4 py-3">কাস্টমার ও মোবাইল</th>
                <th className="px-4 py-3">আইটেম ও কালার</th>
                <th className="px-4 py-3">ডেলিভারি ঠিকানা</th>
                <th className="px-4 py-3 text-right">সর্বমোট (৳)</th>
                <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-center">WhatsApp নোটিফিকেশন</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    কোনো অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                      {order.order_id}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900 block">{order.customer_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{order.mobile_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="truncate text-slate-700">
                            • {i.product_name} <span className="text-amber-700 font-medium">({i.color})</span> x{i.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-600">
                      {order.full_address}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                      ৳{order.grand_total}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ডেলিভারি ৳{order.delivery_charge}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {order.whatsapp_notification_sent ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Smartphone className="w-3 h-3" />
                          <span>প্রেরিত (গ্রুপ ২)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>অপেক্ষমাণ</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-slate-900">{selectedOrder.order_id}</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <span className="text-xs text-slate-500">
                    তৈরি হয়েছে: {new Date(selectedOrder.created_at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowInvoice(!showInvoice)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showInvoice ? 'অর্ডার ভিউ' : 'মেমো / ইনভয়েস'}</span>
                </button>
                <button
                  onClick={() => onSelectOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-5 pt-4 pr-1">
              {showInvoice ? (
                /* Printable Customer Memo / Invoice (PRD) */
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-800 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <h4 className="font-black text-lg text-amber-800">Ghorer Shopping (ঘরের শপিং)</h4>
                      <p className="text-xs text-slate-500">প্রিমিয়াম বাটিক ও দেশীয় হস্তশিল্প</p>
                      <p className="text-xs text-slate-500">ধানমন্ডি, ঢাকা | হেল্পলাইন: ০১৮১৯-০০০০০০</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold bg-slate-200 px-2.5 py-1 rounded">
                        INVOICE: {selectedOrder.order_id}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">পেমেন্ট মেথড: ক্যাশ অন ডেলিভারি (COD)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong className="text-slate-500 uppercase text-[10px] block">বিল প্রাপক:</strong>
                      <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                      <p>{selectedOrder.mobile_number}</p>
                      {selectedOrder.alternative_phone && <p>বিকল্প ফোন: {selectedOrder.alternative_phone}</p>}
                    </div>
                    <div>
                      <strong className="text-slate-500 uppercase text-[10px] block">ডেলিভারি ঠিকানা:</strong>
                      <p>{selectedOrder.full_address}</p>
                      <p>{selectedOrder.area_village}, {selectedOrder.thana_upazila}, {selectedOrder.district}</p>
                    </div>
                  </div>

                  {/* Items Invoice Table */}
                  <table className="w-full text-xs border border-slate-200 bg-white">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-left">আইটেম বিবরণ</th>
                        <th className="p-2 text-center">কালার</th>
                        <th className="p-2 text-center">পরিমাণ</th>
                        <th className="p-2 text-right">একক মূল্য</th>
                        <th className="p-2 text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{it.product_name} ({it.product_code})</td>
                          <td className="p-2 text-center">{it.color}</td>
                          <td className="p-2 text-center">{it.quantity}</td>
                          <td className="p-2 text-right">৳{it.unit_price}</td>
                          <td className="p-2 text-right font-bold">৳{it.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Invoice Summary */}
                  <div className="flex justify-end text-xs">
                    <div className="w-64 space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>সাবটোটাল:</span>
                        <span>৳{selectedOrder.subtotal}</span>
                      </div>
                      {selectedOrder.discount_total > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>ডিসকাউন্ট:</span>
                          <span>-৳{selectedOrder.discount_total}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>ডেলিভারি চার্জ:</span>
                        <span>৳{selectedOrder.delivery_charge}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-1">
                        <span>সর্বমোট প্রদেয়:</span>
                        <span>৳{selectedOrder.grand_total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Order View */
                <>
                  {/* Customer & Address Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>কাস্টমার ও ডেলিভারি তথ্য</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">নাম:</span>
                        <p className="font-semibold text-slate-900">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">মোবাইল নাম্বার:</span>
                        <p className="font-semibold text-slate-900 font-mono flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{selectedOrder.mobile_number}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">জেলা / থানা / এলাকা:</span>
                        <p className="font-semibold text-slate-900">
                          {selectedOrder.district}, {selectedOrder.thana_upazila}, {selectedOrder.area_village}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">সম্পূর্ণ ঠিকানা:</span>
                        <p className="font-semibold text-slate-900">{selectedOrder.full_address}</p>
                      </div>
                      {selectedOrder.delivery_note && (
                        <div className="sm:col-span-2 bg-amber-50/60 p-2 rounded border border-amber-200 text-amber-900">
                          <strong>ডেলিভারি নোট:</strong> {selectedOrder.delivery_note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      অর্ডারকৃত আইটেম ({selectedOrder.items.length})
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.product_name}</p>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span>কোড: {item.product_code}</span>
                                <span>•</span>
                                <span className="font-semibold text-amber-700">কালার: {item.color}</span>
                                <span>•</span>
                                <span>পরিমাণ: {item.quantity} পিস</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-900">৳{item.subtotal}</span>
                            <span className="block text-[10px] text-slate-400">@ ৳{item.unit_price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculations Breakdown */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-end text-xs">
                    <div className="w-64 space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span>সাবটোটাল:</span>
                        <span className="font-semibold">৳{selectedOrder.subtotal}</span>
                      </div>
                      {selectedOrder.discount_total > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>ডিসকাউন্ট:</span>
                          <span className="font-semibold">-৳{selectedOrder.discount_total}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>ডেলিভারি চার্জ ({selectedOrder.district}):</span>
                        <span className="font-semibold">৳{selectedOrder.delivery_charge}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                        <span>সর্বমোট প্রদেয়:</span>
                        <span className="text-base text-amber-700">৳{selectedOrder.grand_total}</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Community Notification Status (PRD Requirement 17, 36) */}
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-950">
                          হোয়াটসঅ্যাপ কমিউনিটি অর্ডার গ্রুপ নোটিফিকেশন (Group 2)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {selectedOrder.whatsapp_notification_sent ? 'সফলভাবে প্রেরিত' : 'প্রেরণ বাকি'}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed">
                      কাস্টমার মেসেঞ্জারে চূড়ান্ত কনফার্মেশন দেওয়ায় এই অর্ডারটি স্বয়ংক্রিয়ভাবে <strong>Group 2 — Order Notification Group</strong>-এ ডিসপ্যাচ করা হয়েছে।
                    </p>

                    {selectedOrder.whatsapp_message_id && (
                      <p className="text-[10px] text-emerald-700 font-mono">
                        WA Message ID: {selectedOrder.whatsapp_message_id}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={handleRetryWhatsAppNotification}
                        disabled={isRetryingWhatsApp}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRetryingWhatsApp ? 'animate-spin' : ''}`} />
                        <span>{isRetryingWhatsApp ? 'প্রেরণ হচ্ছে...' : 'গ্রুপে পুনরায় নোটিফিকেশন পাঠান'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Status History & Update Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      অর্ডার স্ট্যাটাস পরিবর্তন করুন
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {statuses.map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(st)}
                          disabled={isUpdatingStatus || selectedOrder.status === st}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedOrder.status === st
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          } disabled:opacity-50`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="স্ট্যাটাস পরিবর্তনের নোট (যেমন: প্যাকেজিং সম্পন্ন, কুরিয়ার পিকআপ করেছে)..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
