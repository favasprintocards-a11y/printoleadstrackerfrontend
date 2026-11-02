import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MessageSquare, Mail, Building, MapPin, Tag, Calendar, AlertCircle, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

const SOURCE_OPTIONS = [
  'Meta Ads',
  'Google Ads',
  'Instagram Campaign',
  'Facebook Leads',
  'Website Form',
  'Referral',
  'Direct Call',
  'Cold Outreach',
  'WhatsApp Inquiry',
  'Other'
];

export default function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  salesUsers = [],
  availableCampaigns = []
}) {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    company: '',
    city: '',
    product_interest: '',
    campaign_name: 'Meta Ads - General',
    source: 'Meta Ads',
    assigned_to: '',
    assigned_to_users: [],
    status: 'New',
    follow_up_date: '',
    remarks: '',
    activity_note: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      let initialUserIds = [];
      if (initialData.assigned_user_ids) {
        initialUserIds = String(initialData.assigned_user_ids).split(',').map(id => id.trim()).filter(Boolean);
      } else if (initialData.assigned_to) {
        initialUserIds = [String(initialData.assigned_to)];
      }

      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        whatsapp: initialData.whatsapp || initialData.phone || '',
        email: initialData.email || '',
        company: initialData.company || '',
        city: initialData.city || '',
        product_interest: initialData.product_interest || '',
        campaign_name: initialData.campaign_name || 'Meta Ads - General',
        source: initialData.source || 'Meta Ads',
        assigned_to: initialData.assigned_to ? String(initialData.assigned_to) : '',
        assigned_to_users: initialUserIds,
        status: initialData.status || 'New',
        follow_up_date: initialData.follow_up_date ? initialData.follow_up_date.split('T')[0] : '',
        remarks: initialData.remarks || '',
        activity_note: ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        company: '',
        city: '',
        product_interest: '',
        campaign_name: 'Meta Ads - General',
        source: 'Meta Ads',
        assigned_to: '',
        assigned_to_users: [],
        status: 'New',
        follow_up_date: '',
        remarks: '',
        activity_note: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleUserAssignment = (userId) => {
    setFormData(prev => {
      const current = prev.assigned_to_users || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      return {
        ...prev,
        assigned_to_users: updated,
        assigned_to: updated.length > 0 ? String(updated[0]) : ''
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Lead name is required.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        assigned_to_users: formData.assigned_to_users,
        assigned_to: formData.assigned_to_users.length > 0 ? formData.assigned_to_users[0] : null,
        whatsapp: formData.whatsapp.trim() || formData.phone.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Lead Details' : 'Add New Lead'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit ? `Updating profile for ${formData.name || 'lead'}` : 'Fill in the information to add a new contact'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Number
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Defaults to phone if left empty"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. rahul@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Organization
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Apex Tech Ltd"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Bengaluru"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Product Interest */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Interest / Requirement
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Custom NFC Business Cards (500 units)"
                  value={formData.product_interest}
                  onChange={(e) => setFormData({ ...formData, product_interest: e.target.value })}
                  disabled={isEdit && !isAdmin}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Ad Campaign */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ad Campaign
              </label>
              <div className="relative">
                <Megaphone className="w-4 h-4 absolute left-3 top-3 text-[#E8622C]" />
                <input
                  type="text"
                  placeholder="e.g. Meta Ads - Corporate NFC"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  list="campaign-suggestions"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                />
                <datalist id="campaign-suggestions">
                  {availableCampaigns.length > 0 ? (
                    availableCampaigns.map((camp) => (
                      <option key={camp} value={camp} />
                    ))
                  ) : (
                    <>
                      <option value="Meta Ads - Corporate NFC" />
                      <option value="Meta Ads - Reseller Partner" />
                      <option value="Meta Ads - Event Badges" />
                      <option value="Meta Ads - Review Stands" />
                      <option value="Meta Ads - Direct Inquiry" />
                    </>
                  )}
                </datalist>
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                disabled={isEdit && !isAdmin}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] disabled:opacity-75"
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] font-medium"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Follow-up Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
                />
              </div>
            </div>

            {/* Assign To (Admin only) - Multi-Select Support */}
            {isAdmin && (
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assign To Sales Representatives ({formData.assigned_to_users?.length || 0} selected)
                  </label>
                  {formData.assigned_to_users?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assigned_to_users: [], assigned_to: '' }))}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Clear Selection (Unassign)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {salesUsers.filter(u => u.is_active && u.role === 'sales').map((u) => {
                    const isSelected = formData.assigned_to_users?.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleUserAssignment(u.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isSelected
                          ? 'bg-[#E8622C] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'}`} />
                        <span>{u.name}</span>
                        {isSelected && <span className="text-[10px] ml-0.5">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  You can assign one or multiple sales team members to co-manage this lead.
                </p>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key notes about customer requirements..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C]"
            />
          </div>

          {/* Activity note when editing status */}
          {isEdit && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl">
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                Reason for Change / Timeline Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Spoke to client, quotation prepared."
                value={formData.activity_note}
                onChange={(e) => setFormData({ ...formData, activity_note: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-[#E2DDD6] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 text-[#2B2B2B]"
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#E8622C]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
