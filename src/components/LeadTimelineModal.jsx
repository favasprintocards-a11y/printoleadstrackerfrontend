import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Mail, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  Send, 
  User, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { leadApi } from '../api/client';
import StatusBadge from './StatusBadge';
import { 
  formatDateTime, 
  formatDate, 
  getCallUrl, 
  getWhatsAppUrl, 
  getFollowUpStatus 
} from '../utils/formatters';

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Quotation Sent',
  'Won',
  'Lost',
  'Not Reachable'
];

export default function LeadTimelineModal({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status & Note quick update state
  const [newStatus, setNewStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadDetails();
    } else {
      setData(null);
      setError('');
    }
  }, [isOpen, leadId]);

  const loadLeadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await leadApi.getLead(leadId);
      setData(res);
      setNewStatus(res.lead.status);
      setFollowUpDate(res.lead.follow_up_date ? res.lead.follow_up_date.split('T')[0] : '');
      setNote('');
    } catch (err) {
      setError(err.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    try {
      setUpdating(true);
      await leadApi.addActivity(leadId, {
        status: newStatus,
        follow_up_date: followUpDate || null,
        note: note.trim() || `Status updated to ${newStatus}`
      });

      setNote('');
      await loadLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      setError(err.message || 'Failed to record activity.');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  const lead = data?.lead;
  const activities = data?.activities || [];
  const followUpInfo = lead ? getFollowUpStatus(lead.follow_up_date, lead.status) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8622C]/10 border border-[#E8622C]/20 text-[#E8622C] flex items-center justify-center font-bold text-base shrink-0">
              {lead?.name ? lead.name.charAt(0).toUpperCase() : 'L'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{lead?.name || 'Loading...'}</h3>
                {lead && <StatusBadge status={lead.status} />}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {lead?.company ? `${lead.company} • ` : ''}{lead?.city || 'No city'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading lead details and activity history...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {error}
            </div>
          ) : lead ? (
            <>
              {/* Quick Communication & Lead Details Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-linear-to-br from-[#FAF8F5] to-slate-50 border border-[#E2DDD6]">
                <div className="md:col-span-2 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Lead Details
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Phone:</span>{' '}
                      <span className="font-semibold text-slate-800">{lead.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">WhatsApp:</span>{' '}
                      <span className="font-semibold text-slate-800">{lead.whatsapp || lead.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{' '}
                      <span className="font-semibold text-slate-800">{lead.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Assigned To:</span>{' '}
                      <span className="font-semibold text-[#2B2B2B]">
                        {lead.assigned_user_name || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source:</span>{' '}
                      <span className="font-medium text-slate-700">{lead.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Follow-up:</span>{' '}
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${followUpInfo?.badgeClass}`}>
                        {lead.follow_up_date ? formatDate(lead.follow_up_date) : 'None'}
                      </span>
                    </div>
                  </div>

                  {lead.product_interest && (
                    <div className="mt-2 text-xs">
                      <span className="text-slate-400">Interest:</span>{' '}
                      <span className="font-medium text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {lead.product_interest}
                      </span>
                    </div>
                  )}

                  {lead.remarks && (
                    <div className="mt-1 text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      <span className="font-semibold text-slate-700">Notes: </span>
                      {lead.remarks}
                    </div>
                  )}
                </div>

                {/* Instant Actions (Call, WhatsApp, Email) - Mobile Grid */}
                <div className="grid grid-cols-2 md:flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-3 md:pt-0">
                  <a
                    href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 min-h-[42px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={getCallUrl(lead.phone)}
                    className="flex items-center justify-center gap-2 min-h-[42px] px-3 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </a>

                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
                    >
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status Update & Note Action Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E8622C]" />
                  <span>Log Activity / Update Status</span>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        New Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Next Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Conversation Remarks / Activity Note
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Called client, shared product catalog via WhatsApp..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="flex-1 min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                      />
                      <button
                        type="submit"
                        disabled={updating}
                        className="min-h-[42px] px-4 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{updating ? 'Saving...' : 'Post'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Activity History Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>Activity History & Audit Log</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({activities.length} entries)
                  </span>
                </div>

                {activities.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No activity history recorded yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activities.map((act) => (
                      <div key={act.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#E8622C] ring-4 ring-white shadow-xs" />

                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs hover:border-[#E8622C]/40 transition-colors">
                          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                              <span className="font-semibold text-[#E8622C]">{act.user_name || 'System'}</span>
                              {act.old_status && act.old_status !== act.new_status ? (
                                <div className="flex items-center gap-1">
                                  <StatusBadge status={act.old_status} size="xs" />
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                  <StatusBadge status={act.new_status} size="xs" />
                                </div>
                              ) : (
                                <StatusBadge status={act.new_status} size="xs" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {formatDateTime(act.created_at)}
                            </span>
                          </div>

                          {act.notes && (
                            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                              {act.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
