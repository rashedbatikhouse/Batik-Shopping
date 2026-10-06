import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  Users,
  Shirt,
  ShoppingBag,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { WhatsAppGroup, WhatsAppAdmin } from '../types/index.ts';

interface WhatsAppGroupMessage {
  id: string;
  groupId: string;
  groupName: string;
  sender: string;
  senderNumber: string;
  text: string;
  imageUrl?: string;
  metadata?: any;
  timestamp: string;
  deliveryStatus: 'delivered' | 'pending' | 'failed';
}

export const WhatsAppCommunityHub: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<'product' | 'order'>('order');
  const [messages, setMessages] = useState<WhatsAppGroupMessage[]>([]);
  const [admins, setAdmins] = useState<WhatsAppAdmin[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedAdminPhone, setSelectedAdminPhone] = useState('+8801819123456');
  const [loading, setLoading] = useState(false);

  // New Admin form modal state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'manager' | 'operator'>('manager');

  const productGroupId = '120363098765432101@g.us';
  const orderGroupId = '120363098765432102@g.us';

  const fetchGroupsAndMessages = async () => {
    try {
      const activeGid = selectedGroup === 'product' ? productGroupId : orderGroupId;
      const res = await fetch(`/api/whatsapp/messages?groupId=${activeGid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data);
      }

      const groupsRes = await fetch('/api/whatsapp/groups');
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setAdmins(gData.data.admins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroupsAndMessages();
    const interval = setInterval(fetchGroupsAndMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedGroup]);

  const handleSendCommand = async (commandToSend?: string) => {
    const text = commandToSend || inputText;
    if (!text.trim() || loading) return;

    setInputText('');
    setLoading(true);

    try {
      const admin = admins.find((a) => a.phone_number === selectedAdminPhone);
      await fetch('/api/whatsapp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPhone: selectedAdminPhone,
          senderName: admin?.name || 'Authorized Admin',
          text,
        }),
      });

      fetchGroupsAndMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminPhone) return;

    try {
      const res = await fetch('/api/whatsapp/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName,
          phone_number: newAdminPhone,
          role: newAdminRole,
          is_authorized: true,
        }),
      });
      if (res.ok) {
        setShowAddAdmin(false);
        setNewAdminName('');
        setNewAdminPhone('');
        fetchGroupsAndMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (confirm('এই অ্যাডমিনকে ডিলিট করতে চান?')) {
      try {
        await fetch(`/api/whatsapp/admins/${id}`, { method: 'DELETE' });
        fetchGroupsAndMessages();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 p-5 rounded-2xl text-white border border-emerald-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Ghorer Shopping Central WhatsApp Community
                </h2>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  Official Business Engine
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                সিস্টেমে টেলিগ্রাম সম্পূর্ণ নিষিদ্ধ। সমস্ত বিজনেস অর্ডার নোটিফিকেশন ও প্রোডাক্ট ম্যানেজমেন্ট এই হোয়াটসঅ্যাপ কমিউনিটিতে পরিচালিত হয়।
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddAdmin(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>অ্যাডমিন অনুমোদন দিন</span>
          </button>
        </div>
      </div>

      {/* Main WhatsApp Community Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-4 h-[720px]">
        {/* Left Sidebar: Community Groups & Admins */}
        <div className="lg:col-span-1 border-r border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <div className="p-4 border-b border-slate-200 bg-slate-100/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              কমিউনিটি সাব-গ্রুপসমূহ
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {/* Group 2: Order Notification Group (PRD Requirement) */}
            <div
              onClick={() => setSelectedGroup('order')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedGroup === 'order'
                  ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">গ্রুপ ২: অর্ডার নোটিফিকেশন</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">কনফার্মড অর্ডার রিয়েলটাইম ফিড</p>
                </div>
              </div>
            </div>

            {/* Group 1: Product Management Group (PRD Requirement) */}
            <div
              onClick={() => setSelectedGroup('product')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedGroup === 'product'
                  ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Shirt className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">গ্রুপ ১: প্রোডাক্ট ম্যানেজমেন্ট</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">ক্যাটালগ, স্টক ও প্রাইস কমান্ড</p>
                </div>
              </div>
            </div>

            {/* Authorized WhatsApp Admins Section */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                অনুমোদিত হোয়াটসঅ্যাপ অ্যাডমিন ({admins.length})
              </span>

              <div className="space-y-1.5">
                {admins.map((adm) => (
                  <div
                    key={adm.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px]">{adm.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{adm.phone_number}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {adm.role}
                      </span>
                      {admins.length > 1 && (
                        <button
                          onClick={() => handleRemoveAdmin(adm.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operator Selector for Simulating WhatsApp Sender */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              কমান্ড প্রেরকের ফোন সিলেক্ট করুন:
            </label>
            <select
              value={selectedAdminPhone}
              onChange={(e) => setSelectedAdminPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
            >
              {admins.map((a) => (
                <option key={a.id} value={a.phone_number}>
                  {a.name} ({a.phone_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Main Chat Panel: WhatsApp Web Interface */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-100/50">
          {/* Group Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                  selectedGroup === 'order' ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {selectedGroup === 'order' ? <ShoppingBag className="w-5 h-5" /> : <Shirt className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedGroup === 'order'
                    ? 'Group 2 — Order Notification Group'
                    : 'Group 1 — Product Management Group'}
                </h3>
                <span className="text-[11px] text-slate-500 block">
                  {selectedGroup === 'order'
                    ? 'অর্ডার নোটিফিকেশন ও কনফার্মড ডিসপ্যাচ ফিড'
                    : 'প্রোডাক্ট অ্যাড, স্টক, প্রাইস ও স্ট্যাটাস ম্যানেজমেন্ট'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                JID: {selectedGroup === 'order' ? orderGroupId : productGroupId}
              </span>
            </div>
          </div>

          {/* Group Feed Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#efeae2]/60">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-white/80 shadow-xs flex items-center justify-center text-emerald-600 mb-3">
                  {selectedGroup === 'product' ? <Shirt className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  {selectedGroup === 'product'
                    ? 'গ্রুপ ১ (Product Management Group)-এ এখনো কোনো মেসেজ নেই।'
                    : 'গ্রুপ ২ (Order Notification Group)-এ এখনো কোনো অর্ডার আসেনি।'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  {selectedGroup === 'product'
                    ? 'প্রোডাক্ট অ্যাড অপশন থেকে ছবি আপলোড করলেই সাথে সাথে এখানে ছবি ও নোটিফিকেশন দেখতে পাবেন।'
                    : 'মেসেঞ্জারে কাস্টমার অর্ডার কনফার্ম করলে স্বয়ংক্রিয়ভাবে এখানে নোটিফিকেশন আসবে।'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
              const isOrderGroup = selectedGroup === 'order';

              return (
                <div key={msg.id} className="max-w-xl mx-auto">
                  <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/90 text-xs sm:text-sm text-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-emerald-800 text-xs">{msg.sender}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Product Image if attached to Order Notification */}
                    {msg.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 aspect-16/9 bg-slate-100 max-h-48">
                        <img
                          src={msg.imageUrl}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Formatted Text */}
                    <div className="whitespace-pre-line leading-relaxed font-sans text-xs">
                      {msg.text}
                    </div>

                    <div className="pt-1 flex items-center justify-end space-x-1 text-[10px] text-slate-400">
                      <span>✓✓ Delivered</span>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Command Helper Pills for Group 1 */}
          {selectedGroup === 'product' && (
            <div className="bg-white border-t border-slate-200 px-4 py-2 overflow-x-auto scrollbar-none flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                দ্রুত কমান্ড:
              </span>
              <button
                onClick={() => handleSendCommand('/list')}
                className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
              >
                /list
              </button>
              <button
                onClick={() => handleSendCommand('/stock GS-BTK-01 40')}
                className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
              >
                /stock GS-BTK-01 40
              </button>
              <button
                onClick={() => handleSendCommand('/price GS-BTK-01 1500 1350')}
                className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
              >
                /price GS-BTK-01 1500 1350
              </button>
              <button
                onClick={() => handleSendCommand('/toggle GS-BTK-01')}
                className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
              >
                /toggle GS-BTK-01
              </button>
              <button
                onClick={() => handleSendCommand('/search বাটিক')}
                className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
              >
                /search বাটিক
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder={
                selectedGroup === 'product'
                  ? 'কমান্ড লিখুন (যেমন: /stock GS-BTK-01 30 অথবা /list)...'
                  : 'অর্ডার গ্রুপে অ্যাডমিন মেসেজ লিখুন...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-full text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={() => handleSendCommand()}
              disabled={!inputText.trim() || loading}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add WhatsApp Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">নতুন হোয়াটসঅ্যাপ অ্যাডমিন অনুমোদন দিন</h3>
            <p className="text-xs text-slate-500 mb-4">
              শুধুমাত্র অনুমোদিত নম্বর থেকেই Group 1-এ প্রোডাক্ট অ্যাড ও স্টক পরিবর্তন করা সম্ভব।
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অ্যাডমিনের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: আরিয়ান আহমেদ"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নাম্বার (+880 সহ)</label>
                <input
                  type="text"
                  placeholder="+8801819XXXXXX"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রোল ও পারমিশন</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="super_admin">Super Admin (All permissions)</option>
                  <option value="manager">Inventory Manager (Stock, Price, Catalog)</option>
                  <option value="operator">Operator (View &amp; Check)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  অনুমোদন দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
