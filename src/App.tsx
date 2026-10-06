/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { ProductManagement } from './components/ProductManagement.tsx';
import { OrderManagement } from './components/OrderManagement.tsx';
import { CustomerManagement } from './components/CustomerManagement.tsx';
import { MessengerSimulator } from './components/MessengerSimulator.tsx';
import { WhatsAppCommunityHub } from './components/WhatsAppCommunityHub.tsx';
import { HumanHandoffQueue } from './components/HumanHandoffQueue.tsx';
import { SettingsAndKnowledge } from './components/SettingsAndKnowledge.tsx';
import { Order, Product, Customer, HumanHandoffRequest } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    confirmedOrdersCount: 0,
    deliveredOrdersCount: 0,
    cancelledOrdersCount: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingHandoffs: 0,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [handoffRequests, setHandoffRequests] = useState<HumanHandoffRequest[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeAIInfo, setActiveAIInfo] = useState('Gemini 3.8 Flash');
  const [loading, setLoading] = useState(true);

  const fetchAppData = async () => {
    try {
      const [statsRes, prodRes, ordRes, custRes, handoffRes, settingsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/handoff'),
        fetch('/api/settings'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.data);
      }
      if (ordRes.ok) {
        const data = await ordRes.json();
        setOrders(data.data);
      }
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.data);
      }
      if (handoffRes.ok) {
        const data = await handoffRes.json();
        setHandoffRequests(data.data);
      }
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        const prov = sData.data.ai?.provider || 'gemini';
        const model = sData.data.ai?.model || 'gemini-3.8-flash';
        let label = model;
        if (prov === 'openai') label = `OpenAI (${model})`;
        else if (prov === 'grok') label = `Grok (${model})`;
        else if (prov === 'deepseek') label = `DeepSeek (${model})`;
        else label = `Gemini (${model})`;
        setActiveAIInfo(label);
      }
    } catch (err) {
      console.error('[App] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
    const interval = setInterval(fetchAppData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectOrderFromAnywhere = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingHandoffsCount={stats.pendingHandoffs}
        confirmedOrdersCount={stats.confirmedOrdersCount}
        activeModelName={activeAIInfo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            recentOrders={orders}
            products={products}
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrderFromAnywhere}
            activeModelName={activeAIInfo}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement products={products} onRefresh={fetchAppData} />
        )}

        {activeTab === 'orders' && (
          <OrderManagement
            orders={orders}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
            onRefresh={fetchAppData}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            orders={orders}
            onSelectOrder={handleSelectOrderFromAnywhere}
          />
        )}

        {activeTab === 'messenger' && (
          <MessengerSimulator
            activeModelName={activeAIInfo}
            onOrderCreatedNotification={() => {
              fetchAppData();
            }}
          />
        )}

        {activeTab === 'whatsapp' && <WhatsAppCommunityHub />}

        {activeTab === 'handoff' && (
          <HumanHandoffQueue requests={handoffRequests} onRefresh={fetchAppData} />
        )}

        {activeTab === 'settings' && <SettingsAndKnowledge />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 <strong>Ghorer Shopping (ঘরের শপিং)</strong> — AI Sales Agent &amp; WhatsApp Community Order Management
          </span>
          <span className="text-[11px] text-slate-400">
            Powered by Gemini 3.8 Flash • Zero Hallucination Mode • WhatsApp Community Integration
          </span>
        </div>
      </footer>
    </div>
  );
}
