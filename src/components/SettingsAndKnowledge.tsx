import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  BookOpen,
  Truck,
  Facebook,
  Smartphone,
  Database,
  Save,
  CheckCircle2,
  Copy,
  Download,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import {
  AISettings,
  BusinessSettings,
  DeliverySettings,
  FacebookSettings,
  WhatsAppSettings,
  MySQLSettings,
  SystemLog,
} from '../types/index.ts';

export const SettingsAndKnowledge: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'ai' | 'business' | 'delivery' | 'facebook' | 'whatsapp' | 'mysql' | 'logs'
  >('ai');

  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [facebookSettings, setFacebookSettings] = useState<FacebookSettings | null>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings | null>(null);
  const [mysqlSettings, setMysqlSettings] = useState<MySQLSettings | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [sqlSchema, setSqlSchema] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccessNotice, setClearSuccessNotice] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data.data.ai);
        setBusinessSettings(data.data.business);
        setDeliverySettings(data.data.delivery);
        setFacebookSettings(data.data.facebook);
        setWhatsappSettings(data.data.whatsapp);
        setMysqlSettings(data.data.mysql);
      }

      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.data);
      }

      const schemaRes = await fetch('/api/database/schema');
      if (schemaRes.ok) {
        const sqlText = await schemaRes.text();
        setSqlSchema(sqlText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (type: string, payload: any) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/settings/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAIConnection = async () => {
    if (!aiSettings) return;
    setTestingConnection(true);
    setConnectionTestResult(null);

    const activeProv = aiSettings.provider || 'gemini';
    const activeKey = aiSettings.api_keys?.[activeProv] || '';

    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProv,
          model: aiSettings.model,
          apiKey: activeKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionTestResult({ success: true, message: data.message || 'API কানেকশন সফল হয়েছে!' });
      } else {
        setConnectionTestResult({ success: false, message: data.error || 'কানেকশন ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setConnectionTestResult({ success: false, message: err.message || 'নেটওয়ার্ক এরর' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      const res = await fetch('/api/database/clear-data', { method: 'POST' });
      if (res.ok) {
        setShowClearConfirm(false);
        setClearSuccessNotice('সমস্ত ডেমো ডাটা (প্রোডাক্ট, অর্ডার, কাস্টমার ও মেসেজ) সফলভাবে মুছে ফেলা হয়েছে!');
        setTimeout(() => {
          setClearSuccessNotice(null);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <span>সিস্টেম কনফিগারেশন, নলেজ বেজ ও MySQL ডাটাবেজ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI সেলস এজেন্টের আচরণ, রিটার্ন/ডেলিভারি পলিসি এবং মেটা ও হোয়াটসঅ্যাপ ইন্টিগ্রেশন সেটিংস।
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { id: 'ai', label: 'AI সেটিংস ও প্রম্পট', icon: Bot },
          { id: 'business', label: 'বিজনেস নলেজ বেজ', icon: BookOpen },
          { id: 'delivery', label: 'ডেলিভারি চার্জ রুলস', icon: Truck },
          { id: 'facebook', label: 'ফেসবুক মেসেঞ্জার API', icon: Facebook },
          { id: 'whatsapp', label: 'WhatsApp Community', icon: Smartphone },
          { id: 'mysql', label: 'MySQL ডাটাবেজ স্কিমা', icon: Database },
          { id: 'logs', label: 'সিস্টেম লগস', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Settings */}
      {activeSubTab === 'ai' && aiSettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              AI মডেল প্রোভাইডার নির্বাচন করুন (Select AI Provider)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'gemini',
                  name: 'Google Gemini',
                  desc: 'জিমিনি ৩.৮ ফ্লাশ ও প্রো',
                  keyActive: aiSettings.available_keys?.gemini,
                  keyName: 'GEMINI_API_KEY',
                },
                {
                  id: 'openai',
                  name: 'OpenAI (GPT-4o)',
                  desc: 'ওপেন এআই মডেলস',
                  keyActive: aiSettings.available_keys?.openai,
                  keyName: 'OPENAI_API_KEY',
                },
                {
                  id: 'grok',
                  name: 'xAI Grok',
                  desc: 'গ্রক-২ মডেলস',
                  keyActive: aiSettings.available_keys?.grok,
                  keyName: 'GROK_API_KEY',
                },
                {
                  id: 'deepseek',
                  name: 'DeepSeek',
                  desc: 'ডিপসিক চ্যাট ও রিজনার',
                  keyActive: aiSettings.available_keys?.deepseek,
                  keyName: 'DEEPSEEK_API_KEY',
                },
              ].map((prov) => {
                const isSelected = (aiSettings.provider || 'gemini') === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => {
                      let defaultModel = 'gemini-3.8-flash';
                      if (prov.id === 'openai') defaultModel = 'gpt-4o';
                      if (prov.id === 'grok') defaultModel = 'grok-2-latest';
                      if (prov.id === 'deepseek') defaultModel = 'deepseek-chat';

                      setAiSettings({
                        ...aiSettings,
                        provider: prov.id as any,
                        model: defaultModel,
                      });
                      setConnectionTestResult(null);
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{prov.name}</span>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>}
                      </div>
                      <p className="text-[11px] text-slate-500">{prov.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{prov.keyName}</span>
                      {prov.keyActive ? (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          সেট নেই
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model selection & API Key input for selected provider */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>{aiSettings.provider?.toUpperCase() || 'GEMINI'} কনফিগারেশন ও API Key</span>
              {connectionTestResult && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                    connectionTestResult.success
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {connectionTestResult.message}
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মডেল নির্বাচন করুন (Model)
                </label>
                {(aiSettings.provider === 'gemini' || !aiSettings.provider) && (
                  <select
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended Fast)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                  </select>
                )}

                {aiSettings.provider === 'openai' && (
                  <select
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="gpt-4o">gpt-4o (Flagship Omni)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast &amp; Cost-Effective)</option>
                    <option value="o3-mini">o3-mini (Reasoning)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                )}

                {aiSettings.provider === 'grok' && (
                  <select
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="grok-2-latest">grok-2-latest (xAI Grok 2)</option>
                    <option value="grok-2">grok-2</option>
                    <option value="grok-beta">grok-beta</option>
                  </select>
                )}

                {aiSettings.provider === 'deepseek' && (
                  <select
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="deepseek-chat">deepseek-chat (DeepSeek-V3)</option>
                    <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1)</option>
                  </select>
                )}

                <input
                  type="text"
                  placeholder="অথবা কাস্টম মডেল নাম লিখুন (যেমন: gpt-4o)"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{aiSettings.provider === 'gemini' ? 'Gemini API Key' : aiSettings.provider === 'openai' ? 'OpenAI API Key (sk-...)' : aiSettings.provider === 'grok' ? 'xAI Grok API Key (xai-...)' : 'DeepSeek API Key (sk-...)'}</span>
                  {aiSettings.available_keys?.[aiSettings.provider || 'gemini'] && (
                    <span className="text-[10px] text-emerald-600 font-bold">✓ সক্রিয় আছে</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={
                    aiSettings.provider === 'gemini'
                      ? 'AI Studio API Key'
                      : aiSettings.provider === 'openai'
                      ? 'sk-...'
                      : aiSettings.provider === 'grok'
                      ? 'xai-...'
                      : 'sk-...'
                  }
                  value={aiSettings.api_keys?.[aiSettings.provider || 'gemini'] || ''}
                  onChange={(e) => {
                    const prov = aiSettings.provider || 'gemini';
                    setAiSettings({
                      ...aiSettings,
                      api_keys: {
                        ...(aiSettings.api_keys || {}),
                        [prov]: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    সেটিংস সেভ করলে এটি এনক্রিপ্ট হয়ে সুরক্ষিত থাকবে।
                  </span>
                  <button
                    type="button"
                    onClick={handleTestAIConnection}
                    disabled={testingConnection}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <span>{testingConnection ? 'টেস্ট হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">কমিউনিকেশন স্টাইল</label>
              <input
                type="text"
                value={aiSettings.communication_style}
                onChange={(e) => setAiSettings({ ...aiSettings, communication_style: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ন্যাচারাল, আন্তরিক, প্রফেশনাল ও সংক্ষিপ্ত বাংলা উত্তর প্রদানকারী।
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AI সিস্টেম প্রম্পট (PRD সেকশন ৩৪ অনুযায়ী কোর রুলস)
              </label>
              <textarea
                rows={9}
                value={aiSettings.system_prompt}
                onChange={(e) => setAiSettings({ ...aiSettings, system_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSave('ai', aiSettings)}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'AI সেটিংস সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Business Knowledge Base */}
      {activeSubTab === 'business' && businessSettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ব্যবসার নাম</label>
              <input
                type="text"
                value={businessSettings.business_name}
                onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">কাস্টমার হেল্পলাইন ফোন</label>
              <input
                type="text"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">ব্যবসা ও বাটিক সম্পর্কে</label>
              <textarea
                rows={2}
                value={businessSettings.about_business}
                onChange={(e) => setBusinessSettings({ ...businessSettings, about_business: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">রিটার্ন পলিসি (Return Policy)</label>
              <textarea
                rows={3}
                value={businessSettings.return_policy}
                onChange={(e) => setBusinessSettings({ ...businessSettings, return_policy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">এক্সচেঞ্জ পলিসি (Exchange Policy)</label>
              <textarea
                rows={3}
                value={businessSettings.exchange_policy}
                onChange={(e) => setBusinessSettings({ ...businessSettings, exchange_policy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মেথড (Payment Methods)</label>
              <input
                type="text"
                value={businessSettings.payment_methods}
                onChange={(e) => setBusinessSettings({ ...businessSettings, payment_methods: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSave('business', businessSettings)}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'নলেজ বেজ সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Settings */}
      {activeSubTab === 'delivery' && deliverySettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ঢাকার ভেতর ডেলিভারি চার্জ (৳)</label>
              <input
                type="number"
                value={deliverySettings.inside_dhaka_charge}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, inside_dhaka_charge: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ঢাকার আশেপাশে (সাভার/গাজীপুর/নারায়ণগঞ্জ) ৳</label>
              <input
                type="number"
                value={deliverySettings.sub_dhaka_charge}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, sub_dhaka_charge: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ঢাকার বাইরে সারা বাংলাদেশ (৳)</label>
              <input
                type="number"
                value={deliverySettings.outside_dhaka_charge}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, outside_dhaka_charge: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ফ্রি ডেলিভারি অফার (ন্যূনতম অর্ডারে ৳)</label>
              <input
                type="number"
                value={deliverySettings.free_delivery_above}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, free_delivery_above: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ঢাকায় আনুমানিক সময়</label>
              <input
                type="text"
                value={deliverySettings.estimated_dhaka_days}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, estimated_dhaka_days: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ঢাকার বাইরে আনুমানিক সময়</label>
              <input
                type="text"
                value={deliverySettings.estimated_outside_days}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, estimated_outside_days: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSave('delivery', deliverySettings)}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ডেলিভারি চার্জ সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Facebook Messenger API */}
      {activeSubTab === 'facebook' && facebookSettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs">
            <strong>Meta Facebook Messenger Webhook URL:</strong>
            <code className="block mt-1 font-mono bg-white p-2 rounded border border-blue-200 text-blue-800 break-all select-all">
              {window.location.origin}/api/webhook/facebook
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facebook Page ID</label>
              <input
                type="text"
                value={facebookSettings.page_id}
                onChange={(e) => setFacebookSettings({ ...facebookSettings, page_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Webhook Verify Token</label>
              <input
                type="text"
                value={facebookSettings.verify_token}
                onChange={(e) => setFacebookSettings({ ...facebookSettings, verify_token: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Page Access Token</label>
              <input
                type="password"
                value={facebookSettings.page_access_token}
                onChange={(e) => setFacebookSettings({ ...facebookSettings, page_access_token: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSave('facebook', facebookSettings)}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ফেসবুক ক্রেডেনশিয়াল সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: WhatsApp Community Settings */}
      {activeSubTab === 'whatsapp' && whatsappSettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1">
            <p><strong>WhatsApp Community Architecture:</strong></p>
            <p>Group 1: <code>120363098765432101@g.us</code> (Product Management)</p>
            <p>Group 2: <code>120363098765432102@g.us</code> (Order Notification)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Management Group ID (Group 1)</label>
              <input
                type="text"
                value={whatsappSettings.product_management_group_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, product_management_group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notification Group ID (Group 2)</label>
              <input
                type="text"
                value={whatsappSettings.order_notification_group_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, order_notification_group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Cloud API Permanent Access Token</label>
              <input
                type="password"
                value={whatsappSettings.access_token}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, access_token: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSave('whatsapp', whatsappSettings)}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'হোয়াটসঅ্যাপ কনফিগ সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 6: MySQL Database Status & Schema DDL */}
      {activeSubTab === 'mysql' && mysqlSettings && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">MySQL Database Engine</h4>
                <p className="text-xs text-slate-500">
                  বর্তমান ড্রাইভার: <strong className="font-mono text-slate-800">{mysqlSettings.driver}</strong>
                  {mysqlSettings.is_connected ? ' (Connected to MySQL Pool)' : ' (Auto Fallback Embedded Driver)'}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Active &amp; Operational
            </span>
          </div>

          {/* Reset / Clear Demo Data Action */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs text-rose-900 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>সমস্ত ডেমো ডাটা রিসেট ও ডাটাবেজ খালি করুন (Clean Start)</span>
              </h5>
              <p className="text-[11px] text-rose-700 mt-0.5">
                ড্যাশবোর্ডের সব ডেমো প্রোডাক্ট, ডেমো অর্ডার এবং কাস্টমার হিস্টোরি মুছে সম্পূর্ণ খালি অবস্থা তৈরি করুন।
              </p>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer shrink-0"
            >
              <span>সব ডাটা মুছুন (Clear All)</span>
            </button>
          </div>

          {clearSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{clearSuccessNotice}</span>
            </div>
          )}

          {/* Modal for Clear Data Confirmation */}
          {showClearConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">সমস্ত ডেমো ডাটা মুছে ফেলতে চান?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  এই অ্যাকশনের মাধ্যমে ডাটাবেজ থেকে সকল ডেমো প্রোডাক্ট, অর্ডার এবং কাস্টমার ডাটা চিরতরে মুছে ফেলা হবে এবং ফ্রেশ খালি ডাটাবেজ চালু হবে।
                </p>

                <div className="mt-5 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    হ্যাঁ, সব ডাটা মুছুন
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                পূর্ণাঙ্গ MySQL DDL স্ক্রিপ্ট (PRD সেকশন ৩১ ও ৩২ টেবিলসমূহ):
              </label>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchema);
                  setCopiedSchema(true);
                  setTimeout(() => setCopiedSchema(false), 2500);
                }}
                className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSchema ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
              <pre>{sqlSchema}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: System Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">সিস্টেম একটিভিটি লগস ({logs.length})</h3>
            <button
              onClick={fetchSettings}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              রিফ্রেশ
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs flex items-start space-x-3">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 ${
                    log.level === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : log.level === 'warn'
                      ? 'bg-amber-100 text-amber-800'
                      : log.level === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {log.module}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium">{log.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
