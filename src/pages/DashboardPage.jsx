import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  BarChart2,
  RefreshCw,
  Megaphone,
  Layers,
  Trophy,
  Award,
  Target,
  LayoutGrid,
  Table,
  Edit
} from 'lucide-react';
import { dashboardApi, leadApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LeadTimelineModal from '../components/LeadTimelineModal';
import { getCallUrl, getWhatsAppUrl, formatDate, getFollowUpStatus, STATUS_CONFIG } from '../utils/formatters';

export default function DashboardPage({ onNavigateToLeads }) {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected lead for timeline modal
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Sales team view mode ('cards' | 'table')
  const [salesTeamView, setSalesTeamView] = useState('cards');

  // Campaign-wise leads & dashboard filter state
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [campaignLeads, setCampaignLeads] = useState([]);
  const [campaignLeadsLoading, setCampaignLeadsLoading] = useState(false);
  const [campaignLeadsPagination, setCampaignLeadsPagination] = useState({ total: 0 });

  const fetchDashboardData = async (campaign = selectedCampaign) => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, leadsRes] = await Promise.all([
        dashboardApi.getStats(campaign),
        leadApi.getLeads({
          page: 1,
          limit: 6,
          campaign: campaign === 'all' ? '' : campaign
        })
      ]);
      setData(statsRes);
      setCampaignLeads(leadsRes.leads || []);
      setCampaignLeadsPagination(leadsRes.pagination || { total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameCampaign = async (oldName, e) => {
    e.stopPropagation();
    const newName = window.prompt(`Rename campaign "${oldName}" to:`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    try {
      const res = await leadApi.renameCampaign(oldName, newName.trim());
      alert(res.message || 'Campaign renamed successfully.');
      const updatedCampaign = selectedCampaign === oldName ? newName.trim() : selectedCampaign;
      setSelectedCampaign(updatedCampaign);
      fetchDashboardData(updatedCampaign);
    } catch (err) {
      alert(err.message || 'Failed to rename campaign.');
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedCampaign);
  }, [selectedCampaign]);

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-[#8C8782] text-sm">
        Loading analytics dashboard...
      </div>
    );
  }

  const summary = data?.summary || {};
  const statusMap = summary.statusMap || {};
  const urgentFollowUps = data?.urgentFollowUps || [];
  const salesPerformance = data?.salesPerformance || [];
  const teamSummary = data?.teamSummary || {
    totalReps: salesPerformance.length,
    totalAssigned: salesPerformance.reduce((acc, s) => acc + (s.total_leads || 0), 0),
    totalWon: salesPerformance.reduce((acc, s) => acc + (s.won_leads || 0), 0),
    totalPipeline: salesPerformance.reduce((acc, s) => acc + (s.pipeline_leads || 0), 0),
    averageWinRate: 0,
    todayFollowups: 0,
    overdueFollowups: 0
  };
  const sourceBreakdown = data?.sourceBreakdown || [];
  const campaignBreakdown = data?.campaignBreakdown || [];
  const recentActivities = data?.recentActivities || [];
  const overallTotal = data?.overallTotalLeads || summary.totalLeads || 0;

  const selectedCampaignInfo = selectedCampaign === 'all'
    ? {
      name: 'All Campaigns',
      total: summary.totalLeads ?? 0,
      won: summary.wonCount ?? 0,
      lost: summary.lostCount ?? 0,
      pipeline: (statusMap['Interested'] || 0) + (statusMap['Quotation Sent'] || 0) + (statusMap['Follow-up'] || 0)
    }
    : campaignBreakdown.find(cb => cb.campaign === selectedCampaign) || {
      name: selectedCampaign,
      total: summary.totalLeads || campaignLeadsPagination.total || campaignLeads.length || 0,
      won: summary.wonCount || 0,
      lost: summary.lostCount || 0,
      pipeline: (statusMap['Interested'] || 0) + (statusMap['Quotation Sent'] || 0) + (statusMap['Follow-up'] || 0)
    };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-linear-to-r from-[#1A1A1A] via-[#2B2B2B] to-[#1A1A1A] rounded-3xl text-white shadow-xl relative overflow-hidden border border-[#2B2B2B]">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-linear-to-l from-[#E8622C]/20 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8622C]/20 border border-[#E8622C]/30 text-[#E8622C] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back, {user?.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isAdmin ? 'System Lead Analytics & Performance' : 'My Sales Workspace'}
          </h2>
          <p className="text-xs sm:text-sm text-[#EBE8E3] mt-1">
            {isAdmin
              ? 'Track campaigns, manage sales pipeline conversions, and assign incoming leads.'
              : 'Review your scheduled calls, follow-ups, and customer inquiries for today.'}
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => fetchDashboardData(selectedCampaign)}
            title="Refresh statistics"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Global Campaign Filter Scope Switcher */}
      <div className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-4 sm:p-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FDF1EB] text-[#E8622C] flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-[#2B2B2B]">
                  Filter Dashboard by Campaign
                </h3>
                {selectedCampaign !== 'all' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8622C] text-white shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Filtered: {selectedCampaign}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#8C8782] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E2DDD6]">
                    Showing All Campaigns Combined
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C8782] mt-0.5">
                {selectedCampaign !== 'all'
                  ? `All dashboard KPI metrics, pipeline stages, urgent follow-ups, and sales rep figures below are filtered specifically for "${selectedCampaign}".`
                  : 'Viewing aggregate numbers across all active Meta Ads campaigns. Click any campaign below to filter the entire dashboard.'}
              </p>
            </div>
          </div>

          {selectedCampaign !== 'all' && (
            <button
              onClick={() => setSelectedCampaign('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBE8E3] border border-[#E2DDD6] text-xs font-bold text-[#2B2B2B] transition-colors cursor-pointer self-start md:self-auto shrink-0"
              title="Reset view to all campaigns"
            >
              <span>Reset to All</span>
              <RefreshCw className="w-3.5 h-3.5 text-[#E8622C]" />
            </button>
          )}
        </div>

        {/* Campaign Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCampaign('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${selectedCampaign === 'all'
                ? 'bg-[#E8622C] text-white shadow-sm shadow-[#E8622C]/30 scale-[1.02]'
                : 'bg-[#FAF8F5] text-[#2B2B2B] hover:bg-[#EBE8E3] border border-[#E2DDD6]'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Campaigns</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${selectedCampaign === 'all' ? 'bg-white/20 text-white' : 'bg-white text-[#8C8782] border border-[#E2DDD6]'
              }`}>
              {overallTotal}
            </span>
          </button>

          {campaignBreakdown.map((cb) => {
            const isSelected = selectedCampaign === cb.campaign;
            return (
              <button
                key={cb.campaign}
                onClick={() => setSelectedCampaign(cb.campaign)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${isSelected
                    ? 'bg-[#E8622C] text-white shadow-sm shadow-[#E8622C]/30 scale-[1.02]'
                    : 'bg-[#FAF8F5] text-[#2B2B2B] hover:bg-[#EBE8E3] border border-[#E2DDD6]'
                  }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>{cb.campaign}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#E8622C] border border-[#E2DDD6]'
                  }`}>
                  {cb.total}
                </span>
                {cb.won > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-emerald-500/30 text-white' : 'bg-[#F0F6EB] text-[#5C8A3A] border border-[#D3E5C7]'
                    }`}>
                    {cb.won} won
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div
          onClick={() => onNavigateToLeads(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {})}
          className="bg-white p-5 rounded-2xl border border-[#E2DDD6] shadow-xs hover:border-[#E8622C] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8782] truncate max-w-[140px]" title={selectedCampaign !== 'all' ? `${selectedCampaign} Leads` : 'Total Leads'}>
              {selectedCampaign !== 'all' ? `${selectedCampaign}` : (isAdmin ? 'Total System Leads' : 'My Assigned Leads')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF1EB] text-[#E8622C] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
            {summary.totalLeads ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-[#8C8782] flex items-center gap-1">
            <span>{selectedCampaign !== 'all' ? 'View campaign directory' : 'View all leads'}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-[#E8622C]" />
          </div>
        </div>

        {/* Follow-ups Today */}
        <div
          onClick={() => onNavigateToLeads({ followup_filter: 'today', ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
          className="bg-white p-5 rounded-2xl border border-[#E2DDD6] shadow-xs hover:border-[#D89C2B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8782]">Today's Follow-ups</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF7EA] text-[#D89C2B] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#D89C2B]">
            {summary.followUpsToday ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-[#8C8782]">
            {selectedCampaign !== 'all' ? 'Today for this campaign' : 'Scheduled for today'}
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div
          onClick={() => onNavigateToLeads({ followup_filter: 'overdue', ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
          className="bg-white p-5 rounded-2xl border border-[#E2DDD6] shadow-xs hover:border-[#B23A2E] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8782]">Overdue Follow-ups</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF0EF] text-[#B23A2E] flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#B23A2E]">
            {summary.followUpsOverdue ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-[#8C8782]">
            {selectedCampaign !== 'all' ? 'Overdue for this campaign' : 'Action urgently required'}
          </div>
        </div>

        {/* Conversion Rate */}
        <div
          onClick={() => onNavigateToLeads({ status: 'Won', ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
          className="bg-white p-5 rounded-2xl border border-[#E2DDD6] shadow-xs hover:border-[#5C8A3A] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8782]">Won / Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-[#F0F6EB] text-[#5C8A3A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#5C8A3A]">
              {summary.wonCount ?? 0}
            </span>
            <span className="text-xs font-bold text-[#8C8782]">
              ({summary.conversionRate})
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8C8782]">
            {selectedCampaign !== 'all' ? 'Campaign won deals' : 'Won leads ratio'}
          </div>
        </div>
      </div>

      {/* Leads per Status Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD6] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#2B2B2B] flex items-center gap-2">
              <span>Leads by Status Pipeline</span>
              {selectedCampaign !== 'all' && (
                <span className="text-xs font-bold text-[#E8622C] bg-[#FDF1EB] px-2 py-0.5 rounded-full border border-[#E8622C]/20">
                  {selectedCampaign}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#8C8782]">
              {selectedCampaign !== 'all'
                ? `Real-time stage distribution for "${selectedCampaign}"`
                : 'Real-time status distribution across all campaigns'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(statusMap).map(([statusName, count]) => {
            const config = STATUS_CONFIG[statusName] || { bg: 'bg-[#FAF8F5] text-[#2B2B2B]' };
            return (
              <div
                key={statusName}
                onClick={() => onNavigateToLeads({ status: statusName, ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
                className={`p-3 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${config.bg}`}
              >
                <div className="text-[11px] font-semibold truncate">{statusName}</div>
                <div className="text-xl font-black mt-1">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign-Wise Leads Showcase Section */}
      <div id="campaign-wise-leads-section" className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-5 sm:p-6 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF1EB] border border-[#E8622C]/20 text-[#E8622C] text-xs font-bold mb-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Ad Campaign Lead Pipeline</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#2B2B2B]">
              Campaign-Wise Leads
            </h3>
            <p className="text-xs text-[#8C8782] mt-0.5">
              Browse, filter, and contact leads grouped according to their Meta Ad Campaign
            </p>
          </div>

          <button
            onClick={() => onNavigateToLeads && onNavigateToLeads(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {})}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#FDF1EB] border border-[#E2DDD6] hover:border-[#E8622C]/40 text-[#2B2B2B] hover:text-[#E8622C] rounded-xl text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>View All {selectedCampaignInfo.total} Leads in Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Campaign Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 -mx-1 px-1">
          <button
            onClick={() => setSelectedCampaign('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${selectedCampaign === 'all'
                ? 'bg-[#E8622C] text-white shadow-sm shadow-[#E8622C]/30 scale-[1.02]'
                : 'bg-[#FAF8F5] text-[#2B2B2B] hover:bg-[#EBE8E3] border border-[#E2DDD6]'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Campaigns</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${selectedCampaign === 'all' ? 'bg-white/20 text-white' : 'bg-white text-[#8C8782] border border-[#E2DDD6]'
              }`}>
              {summary.totalLeads ?? 0}
            </span>
          </button>

          {campaignBreakdown.map((cb) => {
            const isSelected = selectedCampaign === cb.campaign;
            return (
              <button
                key={cb.campaign}
                onClick={() => setSelectedCampaign(cb.campaign)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${isSelected
                    ? 'bg-[#E8622C] text-white shadow-sm shadow-[#E8622C]/30 scale-[1.02]'
                    : 'bg-[#FAF8F5] text-[#2B2B2B] hover:bg-[#EBE8E3] border border-[#E2DDD6]'
                  }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>{cb.campaign}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#E8622C] border border-[#E2DDD6]'
                  }`}>
                  {cb.total}
                </span>
                {cb.won > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${isSelected ? 'bg-emerald-500/30 text-white' : 'bg-[#F0F6EB] text-[#5C8A3A] border border-[#D3E5C7]'
                    }`}>
                    {cb.won} won
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Campaign KPI Mini-Strip */}
        <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2B2B2B]">
              {selectedCampaign === 'all' ? 'All Active Campaigns' : selectedCampaign}
            </span>
            <span className="text-[#8C8782]">•</span>
            <span className="text-[#8C8782]">
              Showing {campaignLeads.length} of {selectedCampaignInfo.total} leads
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C8782]">Total:</span>
              <span className="font-bold text-[#2B2B2B]">{selectedCampaignInfo.total}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C8782]">Won:</span>
              <span className="font-bold text-[#5C8A3A]">{selectedCampaignInfo.won}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C8782]">Pipeline:</span>
              <span className="font-bold text-[#D89C2B]">{selectedCampaignInfo.pipeline}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C8782]">Win Rate:</span>
              <span className="font-bold text-[#E8622C]">
                {selectedCampaignInfo.total > 0 ? Math.round((selectedCampaignInfo.won / selectedCampaignInfo.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Leads Grid */}
        {campaignLeadsLoading ? (
          <div className="py-12 text-center text-[#8C8782] text-xs bg-[#FAF8F5] rounded-2xl border border-slate-200">
            Loading campaign leads...
          </div>
        ) : campaignLeads.length === 0 ? (
          <div className="py-12 text-center text-[#8C8782] text-xs bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E2DDD6] p-6">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#EBE8E3] flex items-center justify-center text-[#8C8782] mb-2">
              <Megaphone className="w-5 h-5 text-[#E8622C]" />
            </div>
            <div className="font-bold text-[#2B2B2B]">No leads recorded for this campaign yet</div>
            <p className="mt-1">Import leads from Meta Ads Manager or assign existing leads to this campaign.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {campaignLeads.map((lead) => {
              const followUp = getFollowUpStatus(lead.follow_up_date, lead.status);
              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-2xl bg-white border border-[#E2DDD6] hover:border-[#E8622C]/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Name, Status, Assigned Rep */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="font-bold text-sm text-[#2B2B2B] hover:text-[#E8622C] truncate text-left block cursor-pointer"
                        >
                          {lead.name}
                        </button>
                        <div className="text-xs text-[#8C8782] font-mono mt-0.5">
                          {lead.phone}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={lead.status} size="xs" />
                        {lead.assigned_user_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[#FAF8F5] text-[#2B2B2B] border border-[#E2DDD6]">
                            {lead.assigned_user_name.split(',')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company & Product Requirements */}
                    <div className="space-y-1 text-xs text-[#2B2B2B] py-2 border-t border-[#E2DDD6]/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8C8782]">Company:</span>
                        <span className="font-medium truncate max-w-[170px] text-right">
                          {lead.company || '—'} {lead.city ? `(${lead.city})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8C8782]">Interest:</span>
                        <span className="font-semibold text-[#E8622C] truncate max-w-[170px] text-right" title={lead.product_interest}>
                          {lead.product_interest || 'General'}
                        </span>
                      </div>
                      {selectedCampaign === 'all' && (
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-[#8C8782]">Campaign:</span>
                          <span className="font-bold text-[#E8622C] truncate max-w-[170px] text-right">
                            {lead.campaign_name || 'Meta Ads - General'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Follow-up Indicator */}
                    {lead.follow_up_date && (
                      <div className="flex items-center gap-1.5 text-[11px] pt-1.5 pb-1">
                        <span className="text-[#8C8782]">Follow-up:</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold border ${followUp.badgeClass}`}>
                          {followUp.type === 'today' ? 'Today' : followUp.type === 'overdue' ? `Overdue (${formatDate(lead.follow_up_date)})` : formatDate(lead.follow_up_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex items-center gap-2 pt-3 mt-2 border-t border-[#E2DDD6]/60">
                    <a
                      href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Chat"
                      className="flex-1 py-1.5 bg-[#F0F6EB] hover:bg-[#E1EED7] text-[#5C8A3A] border border-[#D3E5C7] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={getCallUrl(lead.phone)}
                      title="Call Lead"
                      className="flex-1 py-1.5 bg-[#FDF1EB] hover:bg-[#FCE4D8] text-[#E8622C] border border-[#F8DCD0] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => setSelectedLeadId(lead.id)}
                      title="View timeline history & log note"
                      className="w-8 h-8 flex items-center justify-center bg-[#FAF8F5] hover:bg-[#EBE8E3] text-[#2B2B2B] rounded-xl transition-colors cursor-pointer shrink-0 border border-[#E2DDD6]"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SALES TEAM WISE PERFORMANCE SECTION (Admin & Sales Managers)             */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-6 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2DDD6]">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="p-2 rounded-xl bg-[#FDF1EB] text-[#E8622C]">
                  <Trophy className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-[#2B2B2B] tracking-tight">
                  Sales Team Wise Performance & Conversion Leaderboard
                </h3>
                {selectedCampaign !== 'all' ? (
                  <span className="text-[11px] font-bold text-[#E8622C] bg-[#FDF1EB] border border-[#E8622C]/20 px-2.5 py-0.5 rounded-full">
                    Campaign: {selectedCampaign}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#5C8A3A] bg-[#F0F6EB] border border-[#D3E5C7] px-2.5 py-0.5 rounded-full">
                    All Campaigns Included
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C8782]">
                Comparative sales rep win closing rates, active deal pipelines, and follow-up discipline
              </p>
            </div>

            {/* View Mode Controls & Quick Action */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="flex items-center bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setSalesTeamView('cards')}
                  title="Cards Grid View"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${salesTeamView === 'cards'
                      ? 'bg-white text-[#2B2B2B] shadow-2xs font-bold'
                      : 'text-[#8C8782] hover:text-[#2B2B2B]'
                    }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalesTeamView('table')}
                  title="Leaderboard Table View"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${salesTeamView === 'table'
                      ? 'bg-white text-[#2B2B2B] shadow-2xs font-bold'
                      : 'text-[#8C8782] hover:text-[#2B2B2B]'
                    }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToLeads({})}
                className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#FDF1EB] text-[#2B2B2B] hover:text-[#E8622C] border border-[#E2DDD6] hover:border-[#E8622C]/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View All Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Ribbon for Team Performance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
              <div className="text-[11px] font-semibold text-[#8C8782]">Active Reps</div>
              <div className="text-xl font-bold text-[#2B2B2B] mt-0.5">
                {teamSummary.totalReps || salesPerformance.length}
              </div>
              <div className="text-[10px] text-[#8C8782] mt-0.5">Assigned to leads</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
              <div className="text-[11px] font-semibold text-[#8C8782]">Total Assigned</div>
              <div className="text-xl font-bold text-[#2B2B2B] mt-0.5">{teamSummary.totalAssigned}</div>
              <div className="text-[10px] text-[#8C8782] mt-0.5">In current scope</div>
            </div>

            <div className="p-3.5 bg-[#F0F6EB] rounded-2xl border border-[#D3E5C7]">
              <div className="text-[11px] font-semibold text-[#5C8A3A]">Total Won Deals</div>
              <div className="text-xl font-bold text-[#5C8A3A] mt-0.5">{teamSummary.totalWon}</div>
              <div className="text-[10px] text-[#5C8A3A] mt-0.5">Closed conversions</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
              <div className="text-[11px] font-semibold text-[#8C8782]">Team Avg Win Rate</div>
              <div className="text-xl font-bold text-[#5C8A3A] mt-0.5">
                {teamSummary.averageWinRate ?? (teamSummary.totalAssigned > 0 ? Math.round((teamSummary.totalWon / teamSummary.totalAssigned) * 100) : 0)}%
              </div>
              <div className="text-[10px] text-[#8C8782] mt-0.5">Won / Assigned</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
              <div className="text-[11px] font-semibold text-[#8C8782]">Active Pipeline</div>
              <div className="text-xl font-bold text-[#D89C2B] mt-0.5">{teamSummary.totalPipeline}</div>
              <div className="text-[10px] text-[#8C8782] mt-0.5">Interested / Follow-up</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
              <div className="text-[11px] font-semibold text-[#8C8782]">Follow-ups Due</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold text-[#D89C2B]">{teamSummary.todayFollowups}</span>
                {teamSummary.overdueFollowups > 0 && (
                  <span className="text-[10px] font-bold text-[#B23A2E] bg-[#FBF0EF] px-1.5 py-0.5 rounded-md border border-[#E8BDB8]">
                    {teamSummary.overdueFollowups} late
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#8C8782] mt-0.5">Scheduled today</div>
            </div>
          </div>

          {/* Cards View vs Table View */}
          {salesPerformance.length === 0 ? (
            <div className="text-center py-10 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E2DDD6] p-6">
              <Users className="w-8 h-8 text-[#8C8782] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#8C8782]">No active sales representatives or assigned leads found for this filter scope.</p>
            </div>
          ) : salesTeamView === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {salesPerformance.map((sp) => {
                const initials = (sp.name || 'Sales Rep')
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                const isRank1 = sp.rank === 1;
                const isRank2 = sp.rank === 2;
                const isRank3 = sp.rank === 3;

                return (
                  <div
                    key={sp.id}
                    className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${isRank1
                        ? 'bg-linear-to-b from-[#FFFDF7] to-white border-[#FDE68A] shadow-xs'
                        : 'bg-[#FAF8F5]/60 hover:bg-white border-[#E2DDD6] hover:shadow-xs'
                      }`}
                  >
                    <div>
                      {/* Top Rank + Win Rate Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isRank1 ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1 shadow-2xs">
                            <Trophy className="w-3.5 h-3.5 text-[#D97706]" />
                            <span>#1 Top Closer</span>
                          </span>
                        ) : isRank2 ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>#2 Rank</span>
                          </span>
                        ) : isRank3 ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5] flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-[#EA580C]" />
                            <span>#3 Rank</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#8C8782] border border-[#E2DDD6]">
                            #{sp.rank} Rank
                          </span>
                        )}

                        <span className="text-xs font-bold text-[#5C8A3A] bg-[#F0F6EB] border border-[#D3E5C7] px-2.5 py-1 rounded-full shadow-2xs">
                          {sp.conversion_rate}% Win Rate
                        </span>
                      </div>

                      {/* Rep Profile Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${isRank1
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                            : 'bg-white text-[#2B2B2B] border-[#E2DDD6]'
                          }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#2B2B2B] truncate">{sp.name}</h4>
                          <p className="text-[11px] text-[#8C8782] truncate">{sp.phone || sp.email || 'Sales Specialist'}</p>
                        </div>
                      </div>

                      {/* Win Rate Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8C8782] font-medium">Conversion Rate</span>
                          <span className="font-bold text-[#2B2B2B]">
                            {sp.won_leads} won / {sp.total_leads} assigned
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#E2DDD6]/70 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#5C8A3A] to-[#86B757] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, sp.conversion_rate))}%` }}
                          />
                        </div>
                      </div>

                      {/* Performance Mini Tiles */}
                      <div className="grid grid-cols-4 gap-2 text-center mb-4">
                        <div className="p-2 bg-white rounded-xl border border-[#E2DDD6]/80">
                          <div className="text-[10px] text-[#8C8782] font-semibold">Won</div>
                          <div className="text-sm font-bold text-[#5C8A3A] mt-0.5">{sp.won_leads}</div>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#E2DDD6]/80">
                          <div className="text-[10px] text-[#8C8782] font-semibold">Pipeline</div>
                          <div className="text-sm font-bold text-[#D89C2B] mt-0.5">{sp.pipeline_leads || 0}</div>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#E2DDD6]/80">
                          <div className="text-[10px] text-[#8C8782] font-semibold">Contacted</div>
                          <div className="text-sm font-bold text-[#2B2B2B] mt-0.5">{sp.contacted_leads || 0}</div>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#E2DDD6]/80">
                          <div className="text-[10px] text-[#8C8782] font-semibold">Total</div>
                          <div className="text-sm font-bold text-[#2B2B2B] mt-0.5">{sp.total_leads}</div>
                        </div>
                      </div>

                      {/* Follow-up status indicators */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E2DDD6]/60 mb-4">
                        <span className="text-[#8C8782] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D89C2B]" />
                          <span>Today: <strong>{sp.today_followups}</strong></span>
                        </span>
                        {sp.overdue_followups > 0 ? (
                          <span className="text-[#B23A2E] font-semibold bg-[#FBF0EF] px-2 py-0.5 rounded-full border border-[#E8BDB8] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{sp.overdue_followups} overdue</span>
                          </span>
                        ) : (
                          <span className="text-[#5C8A3A] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Up to date</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View Assigned Leads Button */}
                    <button
                      type="button"
                      onClick={() => onNavigateToLeads({ assigned_to: sp.id, ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
                      className="w-full py-2.5 px-3 bg-[#FAF8F5] hover:bg-[#FDF1EB] text-[#2B2B2B] hover:text-[#E8622C] border border-[#E2DDD6] hover:border-[#E8622C]/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>View {sp.name.split(' ')[0]}'s Leads ({sp.total_leads})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-2xl border border-[#E2DDD6]">
              <table className="w-full text-left text-xs text-[#2B2B2B]">
                <thead className="bg-[#FAF8F5] text-[#8C8782] font-semibold border-b border-[#E2DDD6]">
                  <tr>
                    <th className="py-3 px-4">Rank & Sales Representative</th>
                    <th className="py-3 px-4 text-center">Assigned Leads</th>
                    <th className="py-3 px-4 text-center">Won Deals</th>
                    <th className="py-3 px-4 text-center">Win Rate</th>
                    <th className="py-3 px-4 text-center">Active Pipeline</th>
                    <th className="py-3 px-4 text-center">Contacted</th>
                    <th className="py-3 px-4 text-center">Follow-ups Today</th>
                    <th className="py-3 px-4 text-center">Overdue</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD6]">
                  {salesPerformance.map((sp) => {
                    const isRank1 = sp.rank === 1;
                    return (
                      <tr key={sp.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isRank1 ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' : 'bg-[#FAF8F5] text-[#8C8782] border border-[#E2DDD6]'
                              }`}>
                              {sp.rank}
                            </span>
                            <div>
                              <div className="font-bold text-[#2B2B2B] flex items-center gap-1.5">
                                <span>{sp.name}</span>
                                {isRank1 && <Trophy className="w-3.5 h-3.5 text-[#D97706]" />}
                              </div>
                              <div className="text-[11px] text-[#8C8782]">{sp.phone || sp.email || 'Sales Specialist'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#2B2B2B]">{sp.total_leads}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#5C8A3A]">{sp.won_leads}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#F0F6EB] text-[#5C8A3A] border border-[#D3E5C7]">
                            {sp.conversion_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-[#D89C2B]">{sp.pipeline_leads || 0}</td>
                        <td className="py-3 px-4 text-center text-[#2B2B2B]">{sp.contacted_leads || 0}</td>
                        <td className="py-3 px-4 text-center font-semibold text-[#2B2B2B]">{sp.today_followups}</td>
                        <td className="py-3 px-4 text-center">
                          {sp.overdue_followups > 0 ? (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FBF0EF] text-[#B23A2E] border border-[#E8BDB8]">
                              {sp.overdue_followups} late
                            </span>
                          ) : (
                            <span className="text-[#5C8A3A] font-semibold text-[11px]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onNavigateToLeads({ assigned_to: sp.id, ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
                            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#FDF1EB] text-[#2B2B2B] hover:text-[#E8622C] border border-[#E2DDD6] hover:border-[#E8622C]/40 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Leads</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Urgent Follow-ups + Sales Performance (or Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Urgent Follow-ups Priority List (2 columns on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#2B2B2B] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E8622C]" />
                  <span>Follow-up Action Priority (Today & Overdue)</span>
                  {selectedCampaign !== 'all' && (
                    <span className="text-[11px] font-bold text-[#E8622C] bg-[#FDF1EB] border border-[#E8622C]/20 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                      {selectedCampaign}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#8C8782]">
                  {selectedCampaign !== 'all'
                    ? `Urgent follow-ups for leads in "${selectedCampaign}"`
                    : 'Quickly reach out and update follow-up logs across all campaigns'}
                </p>
              </div>
              <button
                onClick={() => onNavigateToLeads({ followup_filter: 'today', ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
                className="text-xs font-semibold text-[#E8622C] hover:text-[#D0521F] flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentFollowUps.length === 0 ? (
              <div className="py-12 text-center text-[#8C8782] text-xs bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E2DDD6]">
                🎉 No pending follow-ups for {selectedCampaign !== 'all' ? `"${selectedCampaign}"` : 'today'}! Great job staying ahead.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DDD6]/60">
                {urgentFollowUps.map((lead) => {
                  const followUp = getFollowUpStatus(lead.follow_up_date, lead.status);
                  return (
                    <div key={lead.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="font-bold text-sm text-[#2B2B2B] hover:text-[#E8622C] truncate text-left cursor-pointer"
                          >
                            {lead.name}
                          </button>
                          <StatusBadge status={lead.status} size="xs" />
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${followUp.badgeClass}`}>
                            {followUp.label}
                          </span>
                          {lead.campaign_name && selectedCampaign === 'all' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-[#FDF1EB] text-[#E8622C] border border-[#F8DCD0]">
                              {lead.campaign_name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#8C8782] mt-1 truncate">
                          {lead.company ? `${lead.company} • ` : ''}{lead.phone}
                          {lead.assigned_user_name && isAdmin && (
                            <span className="text-[#E8622C] ml-1">({lead.assigned_user_name})</span>
                          )}
                        </div>
                      </div>

                      {/* Quick Call & WhatsApp Action Buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                        <a
                          href={getWhatsAppUrl(lead.phone, lead.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp chat"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F6EB] hover:bg-[#E1EED7] text-[#5C8A3A] border border-[#D3E5C7] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={getCallUrl(lead.phone)}
                          title="Call phone"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF1EB] hover:bg-[#FCE4D8] text-[#E8622C] border border-[#F8DCD0] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          title="View timeline & update"
                          className="px-3 py-1.5 bg-[#EBE8E3] hover:bg-[#E2DDD6] text-[#2B2B2B] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sales Performance (Admin) or Recent Activities */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-[#2B2B2B]">Sales Team Performance</h3>
                {selectedCampaign !== 'all' && (
                  <span className="text-[10px] font-bold text-[#E8622C] bg-[#FDF1EB] border border-[#E8622C]/20 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                    {selectedCampaign}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C8782] mb-4">
                {selectedCampaign !== 'all'
                  ? `Rep conversions specifically for "${selectedCampaign}"`
                  : 'Assigned leads & conversion wins across all campaigns'}
              </p>

              {salesPerformance.length === 0 ? (
                <div className="text-xs text-[#8C8782] text-center py-6 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E2DDD6]">
                  No sales rep activity recorded for this campaign.
                </div>
              ) : (
                <div className="space-y-3">
                  {salesPerformance.map((sp) => (
                    <div key={sp.id} className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD6]">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${sp.rank === 1 ? 'bg-[#FEF3C7] text-[#92400E]' : sp.rank === 2 ? 'bg-[#F1F5F9] text-[#475569]' : 'bg-[#FAF8F5] text-[#8C8782]'
                            }`}>
                            {sp.rank}
                          </span>
                          <span className="font-bold text-[#2B2B2B]">{sp.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#5C8A3A] bg-[#F0F6EB] border border-[#D3E5C7] px-2 py-0.5 rounded-full">
                          {sp.won_leads} Won ({sp.conversion_rate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8C8782] mt-2">
                        <span>Leads: <strong className="text-[#2B2B2B]">{sp.total_leads}</strong></span>
                        <span>Pipeline: <strong className="text-[#D89C2B]">{sp.pipeline_leads || 0}</strong></span>
                        <button
                          type="button"
                          onClick={() => onNavigateToLeads({ assigned_to: sp.id, ...(selectedCampaign !== 'all' ? { campaign: selectedCampaign } : {}) })}
                          className="text-[#E8622C] hover:underline font-semibold cursor-pointer"
                        >
                          View Leads →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meta Ad Campaigns Breakdown */}
          <div className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#2B2B2B] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#E8622C]" />
                <span>Ad Campaign Breakdown</span>
              </h3>
              <span className="text-[10px] font-semibold text-[#8C8782] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E2DDD6]">
                Meta Ads
              </span>
            </div>
            <p className="text-xs text-[#8C8782] mb-4">Click any campaign to filter entire dashboard</p>

            {campaignBreakdown.length === 0 ? (
              <div className="text-xs text-[#8C8782] text-center py-6 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E2DDD6]">No campaign data recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {campaignBreakdown.map((cb) => {
                  const isSelected = selectedCampaign === cb.campaign;
                  return (
                    <div
                      key={cb.campaign}
                      onClick={() => {
                        setSelectedCampaign(cb.campaign);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group ${isSelected
                          ? 'bg-[#FDF1EB] border-[#E8622C] ring-2 ring-[#E8622C]/20 shadow-xs'
                          : 'bg-[#FAF8F5] hover:bg-[#FDF1EB]/60 border-[#E2DDD6] hover:border-[#E8622C]/40'
                        }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className={`font-bold truncate max-w-[170px] ${isSelected ? 'text-[#E8622C]' : 'text-[#2B2B2B] group-hover:text-[#E8622C]'}`}>
                            {cb.campaign}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleRenameCampaign(cb.campaign, e)}
                              title={`Rename "${cb.campaign}" globally`}
                              className="p-1 rounded-md text-slate-400 hover:text-[#E8622C] hover:bg-white/90 transition-colors shrink-0"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${isSelected ? 'bg-[#E8622C] text-white border-[#E8622C]' : 'bg-white text-[#E8622C] border-[#E8622C]/20'
                            }`}>
                            {cb.total} leads
                          </span>
                          {cb.won > 0 && (
                            <span className="text-[10px] font-bold text-[#5C8A3A] bg-[#F0F6EB] px-1.5 py-0.5 rounded-md border border-[#D3E5C7]">
                              {cb.won} won
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Conversion bar */}
                      <div className="w-full h-1.5 bg-[#E2DDD6]/80 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-linear-to-r from-[#E8622C] to-[#A8C93C] rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(10, Math.min(100, (cb.total / (overallTotal || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sources Breakdown */}
          <div className="bg-white rounded-3xl border border-[#E2DDD6] shadow-xs p-6">
            <h3 className="text-sm font-bold text-[#2B2B2B] mb-1">Top Lead Channels</h3>
            <p className="text-xs text-[#8C8782] mb-4">Traffic and acquisition channel attribution</p>

            <div className="space-y-2.5">
              {sourceBreakdown.map((src) => (
                <div key={src.source} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#2B2B2B]">{src.source}</span>
                  <span className="font-bold text-[#2B2B2B] bg-[#FAF8F5] border border-[#E2DDD6] px-2.5 py-0.5 rounded-full">
                    {src.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Timeline Modal */}
      {selectedLeadId && (
        <LeadTimelineModal
          leadId={selectedLeadId}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => {
            fetchDashboardData(selectedCampaign);
          }}
        />
      )}
    </div>
  );
}
