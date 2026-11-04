import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Users, 
  Tag, 
  AlertCircle, 
  Shuffle, 
  UserCheck, 
  UserX, 
  CheckSquare, 
  Square,
  Sparkles,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Quotation Sent',
  'Won',
  'Lost',
  'Not Reachable',
  'Already Customer'
];

export default function BulkActionModal({
  isOpen,
  onClose,
  selectedCount,
  onBulkAssign,
  onBulkStatus,
  onBulkCampaign,
  salesUsers = [],
  availableCampaigns = []
}) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'assign' : 'status');

  // Multi-select sales team members
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignMode, setAssignMode] = useState('distribute'); // 'distribute' | 'coassign' | 'unassign'

  // Status state
  const [status, setStatus] = useState('Contacted');
  const [note, setNote] = useState('');

  // Ad Campaign state
  const [campaignName, setCampaignName] = useState('Meta Ads - Corporate NFC');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const activeSalesUsers = salesUsers.filter(u => u.is_active && u.role === 'sales');

  const toggleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === activeSalesUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(activeSalesUsers.map(u => u.id));
    }
  };

  const handleExecute = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'assign') {
        if (assignMode === 'unassign') {
          await onBulkAssign([], 'unassign');
        } else {
          if (selectedUserIds.length === 0) {
            setError('Please select at least one salesperson to assign leads to.');
            setLoading(false);
            return;
          }
          await onBulkAssign(selectedUserIds, assignMode);
        }
      } else if (activeTab === 'campaign') {
        if (!campaignName.trim()) {
          setError('Please enter or select an Ad Campaign name.');
          setLoading(false);
          return;
        }
        await onBulkCampaign(campaignName.trim());
      } else {
        await onBulkStatus(status, note.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const isAllUsersSelected = activeSalesUsers.length > 0 && selectedUserIds.length === activeSalesUsers.length;

  // Calculation for round robin distribution
  const perRepCount = selectedUserIds.length > 0 
    ? Math.floor(selectedCount / selectedUserIds.length)
    : 0;
  const remainder = selectedUserIds.length > 0 
    ? selectedCount % selectedUserIds.length 
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bulk Operations</h3>
            <p className="text-xs text-slate-500">
              Applying updates to <span className="font-bold text-[#E8622C]">{selectedCount}</span> selected leads
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-4 border-b border-slate-100 flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('assign')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'assign'
                  ? 'bg-[#E8622C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Sales Team</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('campaign')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'campaign'
                  ? 'bg-[#E8622C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Ad Campaign</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-[#E8622C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Update Status</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="space-y-4">
              {/* Distribution Strategy Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Assignment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignMode('distribute')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      assignMode === 'distribute'
                        ? 'border-[#E8622C] bg-[#E8622C]/10 text-[#2B2B2B] ring-2 ring-[#E8622C]/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Shuffle className="w-3.5 h-3.5 text-[#E8622C]" />
                      <span>Round-Robin Split</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Distribute leads evenly among chosen sales reps.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignMode('coassign')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      assignMode === 'coassign'
                        ? 'border-[#E8622C] bg-[#E8622C]/10 text-[#2B2B2B] ring-2 ring-[#E8622C]/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-[#E8622C]" />
                      <span>Co-Assign to All</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Every selected rep will share ownership of all leads.
                    </p>
                  </button>
                </div>

                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setAssignMode(assignMode === 'unassign' ? 'distribute' : 'unassign')}
                    className={`text-[11px] font-semibold cursor-pointer ${
                      assignMode === 'unassign'
                        ? 'text-rose-600 underline font-bold'
                        : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    {assignMode === 'unassign' ? '✓ Set to Unassign Mode' : 'Or unassign all selected leads'}
                  </button>
                </div>
              </div>

              {assignMode !== 'unassign' && (
                <div>
                  {/* Sales Representatives Multi-Select List */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Sales Representatives ({selectedUserIds.length} of {activeSalesUsers.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="text-xs font-semibold text-[#E8622C] hover:text-[#D0521F] cursor-pointer"
                    >
                      {isAllUsersSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto p-1">
                    {activeSalesUsers.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No active sales representatives found.
                      </div>
                    ) : (
                      activeSalesUsers.map((u) => {
                        const isChecked = selectedUserIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleSelectUser(u.id)}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-[#E8622C]/10 border-[#E8622C]'
                                : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent div
                                className="rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] pointer-events-none"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{u.name}</div>
                                <div className="text-[10px] text-slate-400">{u.email}</div>
                              </div>
                            </div>

                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              {u.assigned_leads_count || 0} active leads
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Distribution Preview pill */}
                  {selectedUserIds.length > 0 && assignMode === 'distribute' && (
                    <div className="mt-3 p-3 bg-linear-to-r from-[#FAF8F5] to-[#FDF1EB] rounded-2xl border border-[#E2DDD6] flex items-center gap-2 text-xs text-[#2B2B2B]">
                      <Sparkles className="w-4 h-4 text-[#E8622C] shrink-0" />
                      <span>
                        <strong>{selectedCount} leads</strong> will be distributed evenly: ~
                        <strong>{perRepCount} {remainder > 0 ? `to ${perRepCount + 1}` : ''} leads</strong> per sales rep across {selectedUserIds.length} chosen reps.
                      </span>
                    </div>
                  )}

                  {selectedUserIds.length > 0 && assignMode === 'coassign' && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        All <strong>{selectedCount} leads</strong> will be co-assigned so all {selectedUserIds.length} sales reps can access and collaborate on them.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {assignMode === 'unassign' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
                  <UserX className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This will clear the salesperson assignment for all <strong>{selectedCount} selected leads</strong>, marking them as Unassigned.
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'campaign' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Ad Campaign
                </label>
                <div className="relative">
                  <Megaphone className="w-4 h-4 absolute left-3 top-3 text-[#E8622C]" />
                  <input
                    type="text"
                    placeholder="e.g. Meta Ads - Corporate NFC"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] font-medium"
                  />
                </div>
              </div>

              {/* Quick Select Preset Campaigns */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Or select existing campaign
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Meta Ads - Corporate NFC',
                    'Meta Ads - Reseller Partner',
                    'Meta Ads - Review Stands',
                    'Meta Ads - Event Badges',
                    'Meta Ads - Summer 2026',
                    ...(availableCampaigns || []).filter(c => !['Meta Ads - Corporate NFC', 'Meta Ads - Reseller Partner', 'Meta Ads - Review Stands', 'Meta Ads - Event Badges', 'Meta Ads - Summer 2026'].includes(c))
                  ].map((camp) => (
                    <button
                      key={camp}
                      type="button"
                      onClick={() => setCampaignName(camp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        campaignName === camp
                          ? 'bg-[#E8622C] text-white border-[#E8622C] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {camp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] border border-[#E2DDD6] rounded-2xl flex items-start gap-2.5 text-xs text-[#2B2B2B]">
                <Sparkles className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
                <span>
                  All <strong>{selectedCount} selected leads</strong> will be grouped under this Ad Campaign. You will be able to filter them by campaign and track conversion ROI.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select New Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] font-medium"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Activity Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bulk follow-up campaign completed"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-[11px] text-slate-500">
            {activeTab === 'assign' && assignMode !== 'unassign' ? (
              <span>Selected reps: <strong>{selectedUserIds.length}</strong></span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={loading || (activeTab === 'assign' && assignMode !== 'unassign' && selectedUserIds.length === 0)}
              className="px-5 py-2 bg-[#E8622C] hover:bg-[#d45624] text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              {loading ? 'Processing...' : activeTab === 'campaign' ? 'Categorize Campaign' : activeTab === 'assign' ? 'Apply Assignment' : 'Apply Status Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
