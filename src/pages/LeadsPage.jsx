import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  UserCheck,
  CheckSquare,
  Square,

  RotateCcw,
  AlertCircle,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Megaphone,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { leadApi, userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LeadModal from '../components/LeadModal';
import LeadTimelineModal from '../components/LeadTimelineModal';
import BulkActionModal from '../components/BulkActionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  formatDate,
  getCallUrl,
  getWhatsAppUrl,
  getFollowUpStatus,
  groupLeadsByDate,
  formatGroupDateHeading
} from '../utils/formatters';

const STATUS_LIST = [
  'All',
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Quotation Sent',
  'Won',
  'Lost',
  'Not Reachable'
];

export default function LeadsPage({ initialFilter = {}, openAddModalTrigger = 0 }) {
  const { user, isAdmin } = useAuth();

  // Leads and Filter State
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown lists
  const [salesUsers, setSalesUsers] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);

  // Active filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter.status || 'all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState(initialFilter.campaign || 'all');
  const [followupFilter, setFollowupFilter] = useState(initialFilter.followup_filter || 'all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState('cards'); // 'cards' | 'table'

  // Sorting state (default: newest leads first)
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at' | 'follow_up_date' | 'name' | 'status' | 'priority'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Active filters count (excluding search)
  const activeFiltersCount = [
    statusFilter !== 'all',
    assignedFilter !== 'all',
    cityFilter !== 'all',
    campaignFilter !== 'all',
    followupFilter !== 'all',
    Boolean(dateFrom),
    Boolean(dateTo)
  ].filter(Boolean).length;

  // Multi-select for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [timelineLeadId, setTimelineLeadId] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, leadId: null, isBulk: false, leadName: '' });

  // Load Sales Users for Admin
  useEffect(() => {
    if (isAdmin) {
      userApi.getUsers()
        .then(res => setSalesUsers((res.users || []).filter(u => u.role === 'sales' && u.is_active)))
        .catch(err => console.error('Failed to load users:', err));
    }
  }, [isAdmin]);

  // Synchronize filters when navigating from Dashboard or Sidebar
  useEffect(() => {
    setStatusFilter(initialFilter?.status || 'all');
    setFollowupFilter(initialFilter?.followup_filter || 'all');
    setAssignedFilter(initialFilter?.assigned_to || 'all');
    if (initialFilter?.campaign !== undefined) setCampaignFilter(initialFilter.campaign);
    if (initialFilter?.search !== undefined) setSearch(initialFilter.search);
    if (initialFilter?.city !== undefined) setCityFilter(initialFilter.city);
    if (initialFilter?.date_from !== undefined) setDateFrom(initialFilter.date_from);
    if (initialFilter?.date_to !== undefined) setDateTo(initialFilter.date_to);
  }, [initialFilter]);

  // Open Add Lead modal when triggered from top Navbar or bottom nav
  useEffect(() => {
    if (openAddModalTrigger > 0) {
      setEditingLead(null);
      setIsAddModalOpen(true);
    }
  }, [openAddModalTrigger]);

  // Helper to toggle sort column or direction
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleSortSelectChange = (combinedValue) => {
    const [field, order] = combinedValue.split(':');
    setSortBy(field);
    setSortOrder(order || 'desc');
  };

  // Fetch Leads — always loads all leads in one request (no pagination)
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: 1,
        limit: 10000,
        search,
        status: statusFilter,
        assigned_to: assignedFilter,
        city: cityFilter,
        campaign: campaignFilter,
        followup_filter: followupFilter,
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const res = await leadApi.getLeads(params);
      setLeads(res.leads || []);
      setTotal(res.pagination?.total || (res.leads || []).length);
      if (res.availableCities) setAvailableCities(res.availableCities);
      if (res.availableCampaigns) setAvailableCampaigns(res.availableCampaigns);
    } catch (err) {
      setError(err.message || 'Failed to fetch leads.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, assignedFilter, cityFilter, campaignFilter, followupFilter, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
    setSelectedIds([]);
  }, [search, statusFilter, assignedFilter, cityFilter, campaignFilter, followupFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAssignedFilter('all');
    setCityFilter('all');
    setCampaignFilter('all');
    setFollowupFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Checkbox helpers
  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length && leads.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectDate = (dayLeads = []) => {
    const dayIds = dayLeads.map(l => l.id);
    const isAllDateSelected = dayIds.length > 0 && dayIds.every(id => selectedIds.includes(id));
    if (isAllDateSelected) {
      setSelectedIds(prev => prev.filter(id => !dayIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...dayIds])));
    }
  };

  // Lead CRUD handlers
  const handleSaveLead = async (formData) => {
    if (editingLead) {
      await leadApi.updateLead(editingLead.id, formData);
    } else {
      await leadApi.createLead(formData);
    }
    fetchLeads();
  };

  const handleDeleteLeadConfirm = async () => {
    try {
      if (deleteDialog.isBulk) {
        await leadApi.bulkDelete(selectedIds);
        setSelectedIds([]);
      } else {
        await leadApi.deleteLead(deleteDialog.leadId);
      }
      setDeleteDialog({ isOpen: false, leadId: null, isBulk: false, leadName: '' });
      fetchLeads();
    } catch (err) {
      alert(err.message || 'Delete operation failed.');
    }
  };

  // Bulk operations
  const handleBulkAssign = async (targetUserIds, mode) => {
    await leadApi.bulkAssign(selectedIds, targetUserIds, mode);
    setSelectedIds([]);
    fetchLeads();
  };

  const handleBulkStatus = async (newStatus, note) => {
    await leadApi.bulkStatus(selectedIds, newStatus, note);
    setSelectedIds([]);
    fetchLeads();
  };

  const handleBulkCampaign = async (newCampaign) => {
    await leadApi.bulkCampaign(selectedIds, newCampaign);
    setSelectedIds([]);
    fetchLeads();
  };

  // Export to Excel
  const handleExport = () => {
    leadApi.exportLeads({
      search,
      status: statusFilter,
      assigned_to: assignedFilter,
      city: cityFilter,
      campaign: campaignFilter,
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: sortBy,
      sort_order: sortOrder
    });
  };

  // Download salesperson-wise report
  const [reportDownloading, setReportDownloading] = useState(false);
  const handleDownloadSalespersonReport = async () => {
    setReportDownloading(true);
    try {
      await leadApi.downloadSalespersonReport({
        campaign: campaignFilter !== 'all' ? campaignFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        date_from: dateFrom,
        date_to: dateTo
      });
    } catch (err) {
      alert('Failed to download report: ' + (err.message || 'Unknown error'));
    } finally {
      setReportDownloading(false);
    }
  };

  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;
  const totalLeads = total || leads.length;

  return (
    <div className="space-y-4">
      {/* Top Banner / Role Notice */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>{isAdmin ? 'All Leads Directory' : 'My Assigned Leads'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8622C]/10 text-[#E8622C] border border-[#E8622C]/20">
              {totalLeads} {totalLeads === 1 ? 'Lead' : 'Leads'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? `System-wide lead database (${totalLeads} total leads recorded)`
              : `Showing leads assigned to ${user?.name} (${totalLeads} leads in your queue)`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isAdmin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{user?.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handleDownloadSalespersonReport}
                disabled={reportDownloading}
                title="Download salesperson-wise leads report (Excel with one sheet per rep)"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E8622C]/40 hover:bg-[#FDF8F5] text-[#E8622C] rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{reportDownloading ? 'Generating...' : 'Sales Report'}</span>
              </button>
              <button
                onClick={() => {
                  setEditingLead(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lead</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Main Search Row with Action Buttons & Sort Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] transition-all"
            />
          </div>

          {/* Quick Date & Attribute Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              id="leads-sort-select"
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => handleSortSelectChange(e.target.value)}
              title="Sort leads according to date or other attributes"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 transition-all cursor-pointer"
            >
              <option value="created_at:desc">📅 Date: Newest First</option>
              <option value="created_at:asc">📅 Date: Oldest First</option>
              <option value="follow_up_date:asc">⏰ Follow-up: Soonest First</option>
              <option value="follow_up_date:desc">⏰ Follow-up: Latest First</option>
              <option value="priority:desc">🎯 Follow-up Priority</option>
              <option value="name:asc">🔤 Name: A to Z</option>
              <option value="name:desc">🔤 Name: Z to A</option>
            </select>

            <button
              id="leads-sort-order-toggle-btn"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Currently sorted ${sortOrder === 'desc' ? 'Descending (Newest / Z-A)' : 'Ascending (Oldest / A-Z)'}. Click to reverse.`}
              className={`p-2 border rounded-xl transition-all cursor-pointer ${sortOrder === 'asc'
                  ? 'bg-[#E8622C]/10 border-[#E8622C]/40 text-[#E8622C]'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Toggle Filters Button */}
          <button
            id="mobile-filters-toggle-btn"
            onClick={() => setShowMobileFilters(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${showMobileFilters || activeFiltersCount > 0
                ? 'bg-[#E8622C]/10 text-[#E8622C] border-[#E8622C]/30'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E8622C] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile View Switcher (Cards vs Table) */}
          <button
            id="mobile-view-toggle-btn"
            onClick={() => setMobileView(prev => prev === 'cards' ? 'table' : 'cards')}
            title={mobileView === 'cards' ? 'Switch to Table View' : 'Switch to Card View'}
            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {mobileView === 'cards' ? (
              <TableIcon className="w-4 h-4 text-slate-700" />
            ) : (
              <LayoutGrid className="w-4 h-4 text-[#E8622C]" />
            )}
          </button>
        </div>

        {/* Scrollable Status Chips (Instagram / Mobile App Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          {STATUS_LIST.map((st) => {
            const isCurrent = (st === 'All' && statusFilter === 'all') || statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st === 'All' ? 'all' : st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${isCurrent
                    ? 'bg-[#E8622C] text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'
                  }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {(showMobileFilters || activeFiltersCount > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Follow-up Urgency Filter */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Follow-up
              </label>
              <select
                value={followupFilter}
                onChange={(e) => setFollowupFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Follow-ups</option>
                <option value="today">Today's Due</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>

            {/* Ad Campaign Filter */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#E8622C] mb-1 flex items-center gap-1">
                <Megaphone className="w-2.5 h-2.5" />
                <span>Campaign</span>
              </label>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
              >
                <option value="all">All Campaigns</option>
                {availableCampaigns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Assigned Salesperson (Admin only) */}
            {isAdmin && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Salesperson
                </label>
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Sales Team</option>
                  <option value="unassigned">Unassigned Only</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* City Filter */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                City / Location
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Cities</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date Range: From */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Created From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Date Range: To & Reset */}
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Created To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={resetFilters}
                title="Reset all filters"
                className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 max-w-lg z-40 p-3 bg-[#1A1A1A] text-white rounded-2xl flex items-center justify-between gap-3 shadow-2xl border border-[#2B2B2B] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold pl-1">
            <CheckSquare className="w-4 h-4 text-[#E8622C] shrink-0" />
            <span>{selectedIds.length} selected</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              Update / Assign
            </button>

            {isAdmin && (
              <button
                onClick={() => setDeleteDialog({
                  isOpen: true,
                  leadId: null,
                  isBulk: true,
                  leadName: `${selectedIds.length} selected leads`
                })}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs cursor-pointer"
                title="Delete selected leads"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Multi-Select Select All Bar */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Select All {leads.length} Leads</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {leads.length} leads
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              Sorted: {
                sortBy === 'created_at'
                  ? (sortOrder === 'desc' ? '📅 Date: Newest First' : '📅 Date: Oldest First')
                  : sortBy === 'follow_up_date'
                    ? (sortOrder === 'asc' ? '⏰ Follow-up: Soonest' : '⏰ Follow-up: Latest')
                    : sortBy === 'name'
                      ? (sortOrder === 'asc' ? '🔤 Name: A-Z' : '🔤 Name: Z-A')
                      : sortBy
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Leads List: Mobile Touch Cards (Default on mobile) */}
      <div className={mobileView === 'cards' ? 'block md:hidden space-y-3' : 'hidden'}>
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
            Loading leads queue...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 p-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <div className="font-semibold text-slate-700">No leads found</div>
            <p className="mt-1">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          groupLeadsByDate(leads).map(({ dateKey, rawDate, leads: dayLeads }) => (
            <React.Fragment key={dateKey}>
              {/* Date Group Heading */}
              <div className="flex items-center justify-between px-1 py-2 mt-3 first:mt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dayLeads.length > 0 && dayLeads.every(l => selectedIds.includes(l.id))}
                    onChange={() => toggleSelectDate(dayLeads)}
                    ref={(el) => {
                      if (el) {
                        const dayIds = dayLeads.map(l => l.id);
                        const hasSome = dayIds.some(id => selectedIds.includes(id));
                        const hasAll = dayIds.length > 0 && dayIds.every(id => selectedIds.includes(id));
                        el.indeterminate = hasSome && !hasAll;
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8622C] bg-[#FDF8F5] border border-[#E8622C]/25 px-3 py-1 rounded-full flex items-center gap-1.5 hover:bg-[#FBEFEA] transition-colors">
                    <Calendar className="w-3 h-3" />
                    {formatGroupDateHeading(rawDate)}
                  </span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {dayLeads.length} lead{dayLeads.length !== 1 ? 's' : ''}
                </span>
              </div>
              {/* Leads for this date */}
              {dayLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                const followUp = getFollowUpStatus(lead.follow_up_date, lead.status);
                const isCurrentUser = !isAdmin && (
                  (lead.assigned_user_name || '').toLowerCase().includes((user?.name || '').toLowerCase()) ||
                  (lead.assigned_user_ids && String(lead.assigned_user_ids).split(',').includes(String(user?.id)))
                );

                return (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-2xl border transition-all ${isSelected
                        ? 'bg-[#E8622C]/5 border-[#E8622C] ring-2 ring-[#E8622C]/20 shadow-xs'
                        : 'bg-white border-slate-200/90 shadow-2xs'
                      }`}
                  >
                    {/* Card Top: Checkbox, Name, Status, Assigned Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(lead.id)}
                          className="mt-1 rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <button
                            onClick={() => setTimelineLeadId(lead.id)}
                            className="font-bold text-slate-900 hover:text-[#E8622C] text-sm text-left truncate block cursor-pointer"
                          >
                            {lead.name}
                          </button>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-1">
                            <Calendar className="w-3 h-3 text-[#E8622C]" />
                            <span>{formatDate(lead.created_at)}</span>
                            {lead.created_at && (
                              <span className="text-slate-400">
                                • {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={lead.status} />
                        {lead.assigned_user_name ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${isCurrentUser
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                              : 'bg-[#FAF8F5] text-[#2B2B2B] border-[#E2DDD6]'
                            }`}>
                            {isCurrentUser ? `✓ You` : lead.assigned_user_name.split(',')[0]}
                          </span>
                        ) : (
                          isAdmin && (
                            <button
                              onClick={() => {
                                setEditingLead(lead);
                                setIsAddModalOpen(true);
                              }}
                              className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
                            >
                              + Assign
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Card Details: Company, City, Product Interest */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2.5 mt-2.5 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Company / Location</span>
                        <span className="truncate block font-medium text-slate-800">
                          {lead.company || '—'} {lead.city ? `(${lead.city})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Interest / Source</span>
                        <span className="truncate block font-medium text-slate-800" title={lead.product_interest}>
                          {lead.product_interest || lead.source}
                        </span>
                      </div>
                    </div>

                    {/* Ad Campaign Tag */}
                    <div className="flex items-center gap-1.5 text-xs pt-2">
                      <Megaphone className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDF1EB] text-[#E8622C] border border-[#E8622C]/30 truncate">
                        {lead.campaign_name || 'Meta Ads - General'}
                      </span>
                    </div>

                    {/* Follow-up Indicator */}
                    {lead.follow_up_date && (
                      <div className="flex items-center gap-1.5 text-xs pt-1.5">
                        <span className="text-slate-400 text-[11px]">Follow-up:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${followUp.badgeClass}`}>
                          {followUp.type === 'today' ? 'Today' : followUp.type === 'overdue' ? `Overdue (${formatDate(lead.follow_up_date)})` : formatDate(lead.follow_up_date)}
                        </span>
                      </div>
                    )}

                    {/* Mobile Thumb-Friendly Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100">
                      {/* WhatsApp Action */}
                      <a
                        href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[42px] px-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Phone Call Action */}
                      <a
                        href={getCallUrl(lead.phone)}
                        className="flex-1 min-h-[42px] px-3 bg-[#E8622C] hover:bg-[#D0521F] active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call</span>
                      </a>

                      {/* Timeline & Notes */}
                      <button
                        onClick={() => setTimelineLeadId(lead.id)}
                        title="View history timeline & log note"
                        className="min-h-[42px] w-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        <Clock className="w-4 h-4" />
                      </button>

                      {/* Edit Lead */}
                      <button
                        onClick={() => {
                          setEditingLead(lead);
                          setIsAddModalOpen(true);
                        }}
                        title="Edit lead"
                        className="min-h-[42px] w-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Lead (Admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteDialog({
                            isOpen: true,
                            leadId: lead.id,
                            isBulk: false,
                            leadName: lead.name
                          })}
                          title="Delete lead"
                          className="min-h-[42px] w-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Main Leads Table (Desktop default or when table mode toggled) */}
      <div className={mobileView === 'table' ? 'block' : 'hidden md:block'}>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                    />
                  </th>
                  {/* Date Column - Clickable Sort */}
                  <th
                    onClick={() => handleSort('created_at')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    title="Click to sort leads by date added"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date Added</span>
                      {sortBy === 'created_at' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#E8622C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#E8622C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>
                  {/* Lead Contact - Clickable Sort */}
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    title="Click to sort leads by contact name"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lead Contact</span>
                      {sortBy === 'name' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#E8622C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#E8622C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5">Company & City</th>
                  <th className="p-3.5">Product & Source</th>
                  {/* Status - Clickable Sort */}
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    title="Click to sort by status"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortBy === 'status' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#E8622C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#E8622C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>
                  {/* Follow-up - Clickable Sort */}
                  <th
                    onClick={() => handleSort('follow_up_date')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    title="Click to sort by follow-up reminder date"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Follow-up</span>
                      {sortBy === 'follow_up_date' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#E8622C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#E8622C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5">Assigned Rep</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading leads database...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No leads found matching current search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  groupLeadsByDate(leads).map(({ dateKey, rawDate, leads: dayLeads }) => (
                    <React.Fragment key={dateKey}>
                      {/* Date separator row */}
                      <tr>
                        <td colSpan={9} className="px-4 py-2.5 bg-[#FDF8F5] border-y border-[#E8622C]/20">
                          <div className="flex items-center gap-2.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={dayLeads.length > 0 && dayLeads.every(l => selectedIds.includes(l.id))}
                                onChange={() => toggleSelectDate(dayLeads)}
                                ref={(el) => {
                                  if (el) {
                                    const dayIds = dayLeads.map(l => l.id);
                                    const hasSome = dayIds.some(id => selectedIds.includes(id));
                                    const hasAll = dayIds.length > 0 && dayIds.every(id => selectedIds.includes(id));
                                    el.indeterminate = hasSome && !hasAll;
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                              />
                              <span className="text-[11px] font-bold text-[#E8622C] flex items-center gap-1.5 hover:text-[#D0521F] transition-colors">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatGroupDateHeading(rawDate)}
                              </span>
                            </label>
                            <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                              {dayLeads.length} lead{dayLeads.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Lead rows for this date */}
                      {dayLeads.map((lead) => {
                        const isSelected = selectedIds.includes(lead.id);
                        const followUp = getFollowUpStatus(lead.follow_up_date, lead.status);

                        return (
                          <tr
                            key={lead.id}
                            className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-[#E8622C]/5' : ''
                              }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(lead.id)}
                                className="rounded border-slate-300 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                              />
                            </td>

                            {/* Date Added */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-[#E8622C]" />
                                <span>{formatDate(lead.created_at)}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 pl-4">
                                {lead.created_at ? new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </div>
                            </td>

                            {/* Lead Contact Info */}
                            <td className="p-3.5">
                              <button
                                onClick={() => setTimelineLeadId(lead.id)}
                                className="font-bold text-slate-900 hover:text-[#E8622C] text-left cursor-pointer"
                              >
                                {lead.name}
                              </button>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{lead.phone}</span>
                                {lead.email && <span className="text-slate-300">•</span>}
                                {lead.email && <span className="truncate max-w-[140px]">{lead.email}</span>}
                              </div>
                            </td>

                            {/* Company & City */}
                            <td className="p-3.5">
                              <div className="font-medium text-slate-800 truncate max-w-[180px]">
                                {lead.company || '—'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {lead.city || 'No location'}
                              </div>
                            </td>

                            {/* Product Interest, Campaign & Source */}
                            <td className="p-3.5">
                              <div className="font-medium text-slate-800 truncate max-w-[200px]" title={lead.product_interest}>
                                {lead.product_interest || 'General Inquiry'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#E8622C] border border-[#E8622C]/30 flex items-center gap-1 shrink-0"
                                  title={`Meta Ad Campaign: ${lead.campaign_name || 'Meta Ads - General'}`}
                                >
                                  <Megaphone className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[130px]">{lead.campaign_name || 'Meta Ads - General'}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">({lead.source})</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              <StatusBadge status={lead.status} />
                            </td>

                            {/* Follow-up Date */}
                            <td className="p-3.5">
                              {lead.follow_up_date ? (
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border font-semibold ${followUp.badgeClass}`}>
                                  {followUp.type === 'today' ? 'Today' : followUp.type === 'overdue' ? `Overdue (${formatDate(lead.follow_up_date)})` : formatDate(lead.follow_up_date)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            {/* Assigned Rep (Visible to both Admin and Sales) */}
                            <td className="p-3.5">
                              {lead.assigned_user_name ? (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {lead.assigned_user_name.split(',').map((name, i) => {
                                    const cleanName = name.trim();
                                    const isCurrentUser = !isAdmin && (cleanName.toLowerCase() === (user?.name || '').toLowerCase() || (lead.assigned_user_ids && String(lead.assigned_user_ids).split(',').includes(String(user?.id))));
                                    return (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${isCurrentUser
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs font-bold'
                                            : 'bg-[#FAF8F5] text-[#2B2B2B] border border-[#E2DDD6]'
                                          }`}
                                      >
                                        {isCurrentUser ? `✓ You (${cleanName})` : cleanName}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                isAdmin ? (
                                  <button
                                    onClick={() => {
                                      setEditingLead(lead);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                                    title="Click to assign this lead"
                                  >
                                    + Assign Rep
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                                )
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Quick WhatsApp */}
                                <a
                                  href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chat on WhatsApp"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>

                                {/* Quick Call */}
                                <a
                                  href={getCallUrl(lead.phone)}
                                  title="Call phone"
                                  className="p-1.5 text-[#E8622C] hover:bg-[#E8622C]/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>

                                {/* Timeline / History */}
                                <button
                                  onClick={() => setTimelineLeadId(lead.id)}
                                  title="View history timeline & log note"
                                  className="p-1.5 text-slate-500 hover:text-[#E8622C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>

                                {/* Edit Lead */}
                                <button
                                  onClick={() => {
                                    setEditingLead(lead);
                                    setIsAddModalOpen(true);
                                  }}
                                  title="Edit details"
                                  className="p-1.5 text-slate-500 hover:text-[#E8622C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {/* Delete Lead (Admin only) */}
                                {isAdmin && (
                                  <button
                                    onClick={() => setDeleteDialog({
                                      isOpen: true,
                                      leadId: lead.id,
                                      isBulk: false,
                                      leadName: lead.name
                                    })}
                                    title="Delete lead"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Total leads count footer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex items-center justify-between text-xs text-slate-600">
        <span>Showing <strong className="text-slate-900">{leads.length}</strong> {leads.length === 1 ? 'lead' : 'leads'}</span>
        {selectedIds.length > 0 && (
          <span className="text-[#E8622C] font-semibold">{selectedIds.length} selected</span>
        )}
      </div>

      {/* Add / Edit Lead Modal */}
      {isAddModalOpen && (
        <LeadModal
          isOpen={isAddModalOpen}
          initialData={editingLead}
          salesUsers={salesUsers}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleSaveLead}
        />
      )}

      {/* History Timeline Modal */}
      {timelineLeadId && (
        <LeadTimelineModal
          leadId={timelineLeadId}
          isOpen={!!timelineLeadId}
          onClose={() => setTimelineLeadId(null)}
          onLeadUpdated={() => fetchLeads()}
        />
      )}

      {/* Bulk Action Modal */}
      {isBulkModalOpen && (
        <BulkActionModal
          isOpen={isBulkModalOpen}
          selectedCount={selectedIds.length}
          salesUsers={salesUsers}
          availableCampaigns={availableCampaigns}
          onClose={() => setIsBulkModalOpen(false)}
          onBulkAssign={handleBulkAssign}
          onBulkStatus={handleBulkStatus}
          onBulkCampaign={handleBulkCampaign}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title={deleteDialog.isBulk ? 'Bulk Delete Leads?' : 'Delete Lead?'}
          message={`Are you sure you want to delete ${deleteDialog.leadName}? This will remove all associated timeline history records and cannot be undone.`}
          confirmText="Yes, Delete"
          onConfirm={handleDeleteLeadConfirm}
          onClose={() => setDeleteDialog({ isOpen: false, leadId: null, isBulk: false, leadName: '' })}
        />
      )}
    </div>
  );
}
