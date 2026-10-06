import React, { useState } from 'react';
import { Headphones, CheckCircle2, Clock, MessageSquare, Send, User, AlertCircle, RefreshCw } from 'lucide-react';
import { HumanHandoffRequest } from '../types/index.ts';

interface HumanHandoffQueueProps {
  requests: HumanHandoffRequest[];
  onRefresh: () => void;
}

export const HumanHandoffQueue: React.FC<HumanHandoffQueueProps> = ({
  requests,
  onRefresh,
}) => {
  const [selectedHandoff, setSelectedHandoff] = useState<HumanHandoffRequest | null>(
    requests.find((r) => r.status === 'pending') || null
  );
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async (id: string) => {
    try {
      await fetch(`/api/handoff/${id}/resolve`, { method: 'POST' });
      onRefresh();
      setSelectedHandoff(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAdminReply = async () => {
    if (!selectedHandoff || !replyText.trim() || loading) return;
    setLoading(true);

    try {
      await fetch('/api/chat/admin-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedHandoff.conversation_id,
          text: replyText,
        }),
      });

      alert('অ্যাডমিন রিপ্লাই কাস্টমারকে পাঠানো হয়েছে!');
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const resolvedRequests = requests.filter((r) => r.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Headphones className="w-5 h-5 text-purple-600" />
            <span>হিউম্যান সাপোর্ট ও অ্যাডমিন হ্যান্ডঅফ কিউ (PRD সেকশন ২২)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            কাস্টমার যখন কোনো মানুষের সাথে কথা বলতে চান, তখন AI স্বয়ংক্রিয় মেসেজ সীমিত করে এবং অ্যাডমিনকে নোটিফিকেশন পাঠায়।
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Handoff Requests */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>পেন্ডিং রিকোয়েস্ট ({pendingRequests.length})</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
              লাইভ
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো পেন্ডিং হিউম্যান সাপোর্ট রিকোয়েস্ট নেই।
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedHandoff(req)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedHandoff?.id === req.id ? 'bg-purple-50/70 border-l-4 border-purple-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{req.customer_name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {req.reason}
                  </p>
                </div>
              ))
            )}

            {resolvedRequests.length > 0 && (
              <>
                <div className="p-2.5 bg-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  সমাধানকৃত ({resolvedRequests.length})
                </div>
                {resolvedRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedHandoff(req)}
                    className="p-3 text-slate-500 hover:bg-slate-50 cursor-pointer opacity-75 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">{req.customer_name}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Resolved</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Selected Request Detail & Direct Response */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[580px]">
          {selectedHandoff ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span>{selectedHandoff.customer_name}</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Conversation ID: {selectedHandoff.conversation_id}
                    </span>
                  </div>

                  {selectedHandoff.status === 'pending' ? (
                    <button
                      onClick={() => handleResolve(selectedHandoff.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সমস্যা সমাধান সম্পন্ন (AI পুনরায় চালু করুন)</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      ✓ Resolved
                    </span>
                  )}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-purple-700">
                    হ্যান্ডঅফের কারণ:
                  </span>
                  <p className="text-sm font-medium">{selectedHandoff.reason}</p>
                  <span className="text-[10px] text-purple-500 block pt-1">
                    অনুরোধের সময়: {new Date(selectedHandoff.requested_at).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* Direct Reply by Human Admin */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  সরাসরি কাস্টমারকে রিপ্লাই দিন (হিউম্যান সাপোর্ট হিসেবে):
                </label>
                <textarea
                  rows={4}
                  placeholder="যেমন: আসসালামু আলাইকুম, আমি Ghorer Shopping-এর সাপোর্ট ম্যানেজার। আপনার কী তথ্য প্রয়োজন ছিল?..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendAdminReply}
                    disabled={!replyText.trim() || loading}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? 'প্রেরণ হচ্ছে...' : 'কাস্টমারকে মেসেজ পাঠান'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Headphones className="w-10 h-10 stroke-1" />
              <p className="text-xs">বাম পাশের লিস্ট থেকে কোনো রিকোয়েস্ট নির্বাচন করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
