import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Smartphone,
  Info,
} from 'lucide-react';
import { Message, Conversation } from '../types/index.ts';

interface MessengerSimulatorProps {
  onOrderCreatedNotification?: () => void;
  activeModelName?: string;
}

export const MessengerSimulator: React.FC<MessengerSimulatorProps> = ({
  onOrderCreatedNotification,
  activeModelName = 'Gemini 3.8 Flash',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [psid, setPsid] = useState('fb-sim-user-' + Math.floor(1000 + Math.random() * 9000));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'নীল কালারের বাটিক থ্রি পিস আছে?',
    'এটার দাম কত আর কাপড় কী?',
    'অর্ডার করতে চাই',
    'আমার নাম রহিম, ০১৮১৯০০১১২২, ধানমন্ডি, ঢাকা। নীল কালার ১ পিস নিব।',
    'হ্যাঁ, অর্ডার কনফার্ম করেন',
    'ডেলিভারি চার্জ কত?',
    'মানুষের সাথে কথা বলতে চাই',
  ];

  const fetchConversation = async () => {
    try {
      const res = await fetch(`/api/chat/conversation?psid=${psid}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.data.conversation);
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [psid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    setInputText('');
    setLoading(true);

    // Optimistically append customer message
    const tempCustomerMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: conversation?.id || 'conv-temp',
      sender: 'customer',
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempCustomerMsg]);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          psid,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages);
        if (data.data.aiMessage?.text?.includes('অভিনন্দন') || data.data.aiMessage?.text?.includes('Order ID')) {
          onOrderCreatedNotification?.();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    const newPsid = 'fb-sim-user-' + Math.floor(1000 + Math.random() * 9000);
    setPsid(newPsid);
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Simulator Explanatory Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 rounded-xl text-white border border-blue-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">ফেসবুক পেজ মেসেঞ্জার লাইভ টেস্ট সিমুলেটর</h3>
            <p className="text-xs text-blue-200">
              PRD সেকশন ৪, ১০, ১১, ১৪, ১৫ ও ২২ অনুযায়ী কাস্টমার যেভাবে ফেসবুকে চ্যাট করে অর্ডার দেয় তা সরাসরি পরীক্ষা করুন।
            </p>
          </div>
        </div>

        <button
          onClick={resetSession}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>নতুন চ্যাট শুরু করুন</span>
        </button>
      </div>

      {/* Realistic Messenger Phone / Window Wrapper */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col h-[680px]">
        {/* Messenger Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                GS
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-slate-900">Ghorer Shopping ঘরে কেনাকাটা</span>
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black">
                  ✓
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">Active now • বাটিক সেলস এজেন্ট</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-full text-[10px] font-bold">
              AI: {activeModelName}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono text-[10px]">
              PSID: {psid}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
          {/* Welcome Info Box inside chat */}
          <div className="max-w-md mx-auto p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-center text-xs text-amber-900 space-y-1">
            <p className="font-bold">🌸 আসসালামু আলাইকুম! Ghorer Shopping-এ স্বাগতম</p>
            <p className="text-[11px] text-amber-800">
              আমাদের সকল বাটিক থ্রি-পিস পিওর সুতি পাকা রঙের। আপনি যেকোনো বাটিকের দাম, কালার বা ডেলিভারি সম্পর্কে জানতে প্রশ্ন করতে পারেন।
            </p>
          </div>

          {messages.map((msg) => {
            const isCustomer = msg.sender === 'customer';

            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                {!isCustomer && (
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs ${
                    isCustomer
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {/* Inline Product Image Attachment */}
                  {msg.image_url && (
                    <div className="mb-2.5 rounded-lg overflow-hidden border border-slate-200 aspect-4/3 max-w-xs bg-slate-100">
                      <img
                        src={msg.image_url}
                        alt="Batik Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Message Text with preserved lines */}
                  <div className="whitespace-pre-line leading-relaxed font-sans">
                    {msg.text}
                  </div>

                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isCustomer ? 'text-blue-100 text-right' : 'text-slate-400 text-left'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isCustomer && (
                  <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-xs flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompt Pills */}
        <div className="bg-white border-t border-slate-100 px-4 py-2 overflow-x-auto scrollbar-none flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            টেস্ট প্রম্পট:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="text-[11px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            placeholder="মেসেঞ্জারে মেসেজ লিখুন (যেমন: এই বাটিক থ্রি পিসটা নিতে চাই)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-full text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
