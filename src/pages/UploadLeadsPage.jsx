import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  FileCheck,
  RefreshCw,
  UserCheck,
  Megaphone,
  Search,
  History,
  Copy,
  Check,
  Eye,
  XCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { leadApi, userApi } from '../api/client';

export default function UploadLeadsPage({ onNavigateToLeads }) {
  // Navigation mode: 'upload' or 'history'
  const [activeTab, setActiveTab] = useState('upload');

  // File & parsing state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Preview data
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [defaultAssignedTo, setDefaultAssignedTo] = useState('');
  const [defaultCampaignName, setDefaultCampaignName] = useState('Meta Ads - General');
  const [salesUsers, setSalesUsers] = useState([]);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);

  // Import execution state
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Inspector filters & search for post-import and history
  const [issueFilter, setIssueFilter] = useState('all'); // 'all' | 'duplicate' | 'validation_error' | 'imported'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(null);

  // History state
  const [historyBatches, setHistoryBatches] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchIssues, setBatchIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    userApi.getUsers()
      .then(res => setSalesUsers((res.users || []).filter(u => u.role === 'sales' && u.is_active)))
      .catch(err => console.error('Failed to load users:', err));

    leadApi.getCampaigns()
      .then(res => {
        const camps = (res.campaigns || []).map(c => c.campaign).filter(Boolean);
        setAvailableCampaigns(camps);
      })
      .catch(err => console.error('Failed to load campaigns:', err));
  }, []);

  // Load history when tab is switched to 'history'
  useEffect(() => {
    if (activeTab === 'history') {
      loadImportHistory();
    }
  }, [activeTab]);

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await leadApi.getImportHistory();
      const batches = res.batches || [];
      setHistoryBatches(batches);
      if (batches.length > 0 && !selectedBatch) {
        handleSelectBatch(batches[0]);
      }
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectBatch = async (batch) => {
    setSelectedBatch(batch);
    setLoadingIssues(true);
    try {
      const res = await leadApi.getImportIssues(batch.id);
      setBatchIssues(res.issues || []);
    } catch (err) {
      console.error('Failed to load batch issues:', err);
      setBatchIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    setParseError('');
    setImportSummary(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await leadApi.previewUpload(formData);

      setPreviewData(res);
      setColumnMapping(res.suggestedMapping || {});
    } catch (err) {
      setParseError(err.message || 'Failed to parse Excel file.');
      setPreviewData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleMappingChange = (fieldKey, headerName) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: headerName
    }));
  };

  const handleExecuteImport = async () => {
    if (!previewData || !previewData.rows) return;

    if (!columnMapping.phone) {
      alert('Please map a column for Phone Number. It is required.');
      return;
    }

    try {
      setImporting(true);
      setParseError('');

      const res = await leadApi.executeImport({
        rows: previewData.rows,
        columnMapping,
        defaultAssignedTo: defaultAssignedTo || null,
        defaultCampaignName: defaultCampaignName ? defaultCampaignName.trim() : 'Meta Ads - General',
        fileName: file?.name || 'leads_import.xlsx'
      });

      setImportSummary(res.summary);
      setIssueFilter('all');
      setSearchQuery('');
    } catch (err) {
      setParseError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    leadApi.downloadTemplate();
  };

  const handleDownloadErrorReport = () => {
    if (!importSummary) return;
    leadApi.downloadErrorReport(importSummary.errors || [], importSummary.duplicates || []);
  };

  const handleDownloadHistoricalErrorReport = (batch) => {
    if (!batchIssues || batchIssues.length === 0) return;
    const errors = batchIssues.filter(i => i.issue_type === 'validation_error').map(i => ({
      row: i.row_number,
      name: i.lead_name,
      phone: i.phone,
      company: i.company,
      city: i.city,
      campaign_name: i.campaign_name,
      reason: i.reason
    }));
    const duplicates = batchIssues.filter(i => i.issue_type === 'duplicate').map(i => ({
      row: i.row_number,
      name: i.lead_name,
      phone: i.phone,
      company: i.company,
      city: i.city,
      campaign_name: i.campaign_name,
      reason: i.reason
    }));
    leadApi.downloadErrorReport(errors, duplicates);
  };

  const handleCopyPhone = (phoneText) => {
    if (!phoneText) return;
    navigator.clipboard.writeText(phoneText);
    setCopiedPhone(phoneText);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setImportSummary(null);
    setParseError('');
    setSearchQuery('');
    setIssueFilter('all');
  };

  // Standard fields metadata
  const standardFields = [
    { key: 'name', label: 'Full Name', required: true },
    { key: 'phone', label: 'Phone Number', required: true },
    { key: 'whatsapp', label: 'WhatsApp Number', required: false },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'company', label: 'Company Name', required: false },
    { key: 'city', label: 'City / Location', required: false },
    { key: 'product_interest', label: 'Product Interest', required: false },
    { key: 'campaign_name', label: 'Ad Campaign', required: false },
    { key: 'source', label: 'Lead Source', required: false },
    { key: 'remarks', label: 'Remarks / Notes', required: false }
  ];

  // Helper to compile all issue items for current import summary
  const getCompiledSummaryItems = () => {
    if (!importSummary) return [];
    const items = [];

    // Add duplicates
    (importSummary.duplicates || []).forEach(d => {
      items.push({
        ...d,
        type: 'duplicate'
      });
    });

    // Add validation errors
    (importSummary.errors || []).forEach(e => {
      items.push({
        ...e,
        type: 'validation_error'
      });
    });

    // Add successfully imported leads
    (importSummary.imported || []).forEach(imp => {
      items.push({
        row: '—',
        name: imp.name,
        phone: imp.phone,
        company: imp.company || '—',
        city: '—',
        campaign_name: imp.campaign_name || '—',
        type: 'imported',
        reason: 'Successfully imported into CRM leads'
      });
    });

    return items;
  };

  // Filter items by type and search query
  const filterIssuesList = (items) => {
    return items.filter(item => {
      // Type filter
      if (issueFilter === 'duplicate' && item.type !== 'duplicate' && item.issue_type !== 'duplicate') return false;
      if (issueFilter === 'validation_error' && item.type !== 'validation_error' && item.issue_type !== 'validation_error') return false;
      if (issueFilter === 'imported' && item.type !== 'imported') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = String(item.name || item.lead_name || '').toLowerCase().includes(q);
        const phoneMatch = String(item.phone || '').toLowerCase().includes(q);
        const companyMatch = String(item.company || '').toLowerCase().includes(q);
        const campaignMatch = String(item.campaign_name || '').toLowerCase().includes(q);
        const reasonMatch = String(item.reason || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || companyMatch || campaignMatch || reasonMatch;
      }

      return true;
    });
  };

  const summaryItems = getCompiledSummaryItems();
  const filteredSummaryItems = filterIssuesList(summaryItems);
  const filteredHistoricalIssues = filterIssuesList(batchIssues);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Navigation Switcher */}
      <div className="p-6 bg-white rounded-3xl border border-[#E2DDD6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E8622C]/10 text-[#E8622C]">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#2B2B2B] tracking-tight">
              Excel & CSV Bulk Lead Importer
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Import contacts from Meta Ads, Google Ads, or spreadsheets with automated duplicate detection and live error inspection.
          </p>
        </div>

        {/* Tab Switcher & Sample Download */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'upload'
                  ? 'bg-white text-[#2B2B2B] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
                }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Upload New File</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'history'
                  ? 'bg-white text-[#2B2B2B] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
                }`}
            >
              <History className="w-3.5 h-3.5 text-[#D89C2B]" />
              <span>Skipped & Issues Log</span>
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Sample Template</span>
          </button>
        </div>
      </div>

      {parseError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-[#B23A2E] text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{parseError}</span>
        </div>
      )}

      {/* VIEW MODE 1: HISTORICAL BATCHES & SKIPPED LEADS ARCHIVE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left sidebar: list of batches */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E2DDD6] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E8622C]" />
                  <h3 className="text-sm font-bold text-[#2B2B2B]">Import Batches</h3>
                </div>
                <button
                  onClick={loadImportHistory}
                  className="text-[11px] font-semibold text-[#E8622C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-stone-400">Loading import history...</div>
              ) : historyBatches.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                  <p className="font-semibold text-stone-600">No import batches recorded yet.</p>
                  <p className="text-[11px]">Upload a spreadsheet to see duplicate & error logs here.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {historyBatches.map(batch => {
                    const isSelected = selectedBatch?.id === batch.id;
                    const totalSkipped = (batch.duplicate_count || 0) + (batch.error_count || 0);
                    return (
                      <div
                        key={batch.id}
                        onClick={() => handleSelectBatch(batch)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${isSelected
                            ? 'bg-amber-50/60 border-[#D89C2B] shadow-xs'
                            : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/80'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-stone-900 truncate">
                            {batch.file_name}
                          </div>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap">
                            #{batch.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                          <span>{new Date(batch.created_at).toLocaleDateString()} {new Date(batch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>by {batch.imported_by_name || 'Admin'}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200/60 text-[10px] font-bold">
                          <span className="text-[#5C8A3A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {batch.imported_count} imported
                          </span>
                          {batch.duplicate_count > 0 && (
                            <span className="text-[#D89C2B] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              {batch.duplicate_count} dupes
                            </span>
                          )}
                          {batch.error_count > 0 && (
                            <span className="text-[#B23A2E] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                              {batch.error_count} errors
                            </span>
                          )}
                          {totalSkipped === 0 && (
                            <span className="text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                              0 skipped
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right main area: selected batch issues */}
            <div className="lg:col-span-8 space-y-4">
              {selectedBatch ? (
                <div className="bg-white rounded-3xl border border-[#E2DDD6] p-6 shadow-xs space-y-6">
                  {/* Batch Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#2B2B2B]">
                          {selectedBatch.file_name}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded-full font-medium">
                          Batch #{selectedBatch.id}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Imported on {new Date(selectedBatch.created_at).toLocaleString()} • Total {selectedBatch.total_rows} rows processed
                      </p>
                    </div>

                    {batchIssues.length > 0 && (
                      <button
                        onClick={() => handleDownloadHistoricalErrorReport(selectedBatch)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Issues Excel</span>
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Pill Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C8A3A]">
                        Successfully Imported
                      </div>
                      <div className="text-xl font-black text-[#5C8A3A] mt-0.5">
                        {selectedBatch.imported_count}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#D89C2B]">
                        Duplicates Skipped
                      </div>
                      <div className="text-xl font-black text-[#D89C2B] mt-0.5">
                        {selectedBatch.duplicate_count}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#B23A2E]">
                        Validation Errors
                      </div>
                      <div className="text-xl font-black text-[#B23A2E] mt-0.5">
                        {selectedBatch.error_count}
                      </div>
                    </div>
                  </div>

                  {/* Issues Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setIssueFilter('all')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        All Issues ({batchIssues.length})
                      </button>
                      <button
                        onClick={() => setIssueFilter('duplicate')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'duplicate' ? 'bg-white text-[#D89C2B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Duplicates ({batchIssues.filter(i => i.issue_type === 'duplicate').length})
                      </button>
                      <button
                        onClick={() => setIssueFilter('validation_error')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'validation_error' ? 'bg-white text-[#B23A2E] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Validation Errors ({batchIssues.filter(i => i.issue_type === 'validation_error').length})
                      </button>
                    </div>

                    {/* Search box */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search skipped leads..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 w-full sm:w-52"
                      />
                    </div>
                  </div>

                  {/* Issues Table */}
                  {loadingIssues ? (
                    <div className="py-12 text-center text-xs text-stone-400">Loading issues list...</div>
                  ) : filteredHistoricalIssues.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-[#5C8A3A]" />
                      <div className="text-xs font-bold text-stone-800">
                        {batchIssues.length === 0
                          ? 'Zero Skipped Leads in this Batch'
                          : 'No matching records found for this filter'}
                      </div>
                      <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                        {batchIssues.length === 0
                          ? 'All rows in this spreadsheet were successfully imported into active CRM leads.'
                          : 'Try adjusting your search query or switching issue tabs above.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-stone-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold">
                            <th className="p-3 w-14 text-center">Row</th>
                            <th className="p-3">Lead Name</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Issue Type</th>
                            <th className="p-3">Why Was It Skipped?</th>
                            <th className="p-3">Ad Campaign</th>
                            <th className="p-3">Company / City</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredHistoricalIssues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-stone-50/60 transition-colors">
                              <td className="p-3 text-center text-stone-400 font-mono text-[11px]">
                                #{issue.row_number}
                              </td>
                              <td className="p-3 font-semibold text-stone-900">
                                {issue.lead_name || '—'}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-700">
                                  <span>{issue.phone || '—'}</span>
                                  {issue.phone && issue.phone !== '(Empty)' && (
                                    <button
                                      onClick={() => handleCopyPhone(issue.phone)}
                                      title="Copy phone"
                                      className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                                    >
                                      {copiedPhone === issue.phone ? (
                                        <Check className="w-3 h-3 text-[#5C8A3A]" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                {issue.issue_type === 'duplicate' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-[#D89C2B] border border-amber-200/80">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Duplicate Skipped</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-[#B23A2E] border border-rose-200/80">
                                    <XCircle className="w-3 h-3" />
                                    <span>Validation Error</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-stone-700 max-w-xs">
                                <div className="text-[11px] font-medium leading-relaxed">
                                  {issue.reason}
                                </div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                                  {issue.campaign_name || '—'}
                                </span>
                              </td>
                              <td className="p-3 text-stone-600 text-[11px] whitespace-nowrap">
                                <div>{issue.company || '—'}</div>
                                {issue.city && issue.city !== '—' && (
                                  <div className="text-[10px] text-stone-400">{issue.city}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E2DDD6] p-12 text-center text-stone-400 text-xs">
                  Select an import batch from the left to inspect its skipped and validation error leads.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: UPLOAD & ACTIVE IMPORT SUMMARY */}
      {activeTab === 'upload' && (
        <>
          {/* Post-Import Summary Card with Interactive Live Inspector */}
          {importSummary ? (
            <div className="p-6 bg-white rounded-3xl border border-[#E2DDD6] shadow-md space-y-6 animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#5C8A3A] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2B2B2B]">Import Processing Completed</h3>
                    <p className="text-xs text-stone-500">
                      Processed a total of <strong className="text-stone-800">{importSummary.total}</strong> rows from {file?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(importSummary.duplicateCount > 0 || importSummary.errorCount > 0) && (
                    <button
                      onClick={handleDownloadErrorReport}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Issues Excel</span>
                    </button>
                  )}
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Another</span>
                  </button>
                  <button
                    onClick={() => onNavigateToLeads()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E8622C] hover:bg-[#d05321] text-white rounded-xl text-xs font-bold shadow-md shadow-[#E8622C]/20 cursor-pointer"
                  >
                    <span>View All Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setIssueFilter('imported')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${issueFilter === 'imported'
                      ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/30'
                      : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50'
                    }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5C8A3A] flex items-center justify-between">
                    <span>Successfully Imported</span>
                    <CheckCircle2 className="w-4 h-4 text-[#5C8A3A]" />
                  </div>
                  <div className="text-2xl font-black mt-1 text-[#5C8A3A]">
                    {importSummary.importedCount}
                  </div>
                  <div className="text-[11px] text-[#5C8A3A]/80 mt-0.5">
                    Saved into active CRM leads
                  </div>
                </div>

                <div
                  onClick={() => setIssueFilter('duplicate')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${issueFilter === 'duplicate'
                      ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-amber-50 border-amber-200 hover:bg-amber-100/50'
                    }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#D89C2B] flex items-center justify-between">
                    <span>Duplicates Skipped</span>
                    <AlertTriangle className="w-4 h-4 text-[#D89C2B]" />
                  </div>
                  <div className="text-2xl font-black mt-1 text-[#D89C2B]">
                    {importSummary.duplicateCount}
                  </div>
                  <div className="text-[11px] text-[#D89C2B]/80 mt-0.5">
                    Existing in CRM or duplicate in file
                  </div>
                </div>

                <div
                  onClick={() => setIssueFilter('validation_error')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${issueFilter === 'validation_error'
                      ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-400/30'
                      : 'bg-rose-50 border-rose-200 hover:bg-rose-100/50'
                    }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#B23A2E] flex items-center justify-between">
                    <span>Validation Errors</span>
                    <XCircle className="w-4 h-4 text-[#B23A2E]" />
                  </div>
                  <div className="text-2xl font-black mt-1 text-[#B23A2E]">
                    {importSummary.errorCount}
                  </div>
                  <div className="text-[11px] text-[#B23A2E]/80 mt-0.5">
                    Missing or invalid phone number
                  </div>
                </div>
              </div>

              {/* Interactive Skipped Leads Inspector */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#2B2B2B] flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#E8622C]" />
                      <span>Skipped & Validation Issues Inspector</span>
                    </h4>
                    <p className="text-xs text-stone-500">
                      Examine each lead that was omitted or imported below.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setIssueFilter('all')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        All Rows ({summaryItems.length})
                      </button>
                      <button
                        onClick={() => setIssueFilter('duplicate')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'duplicate' ? 'bg-white text-[#D89C2B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Duplicates ({importSummary.duplicateCount})
                      </button>
                      <button
                        onClick={() => setIssueFilter('validation_error')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'validation_error' ? 'bg-white text-[#B23A2E] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Errors ({importSummary.errorCount})
                      </button>
                      <button
                        onClick={() => setIssueFilter('imported')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${issueFilter === 'imported' ? 'bg-white text-[#5C8A3A] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Imported ({importSummary.importedCount})
                      </button>
                    </div>

                    {/* Search box */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search rows..."
                        className="pl-8 pr-3 py-1 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 w-40 sm:w-48"
                      />
                    </div>
                  </div>
                </div>

                {/* Table of items */}
                {filteredSummaryItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
                    No records match the selected filter or search term.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold">
                          <th className="p-3 w-14 text-center">Row</th>
                          <th className="p-3">Lead Name</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Status / Category</th>
                          <th className="p-3">Reason / Details</th>
                          <th className="p-3">Ad Campaign</th>
                          <th className="p-3">Company / City</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredSummaryItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                            <td className="p-3 text-center text-stone-400 font-mono text-[11px]">
                              {item.row !== '—' ? `#${item.row}` : '—'}
                            </td>
                            <td className="p-3 font-semibold text-stone-900">
                              {item.name || '—'}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-700">
                                <span>{item.phone || '—'}</span>
                                {item.phone && item.phone !== '(Empty)' && (
                                  <button
                                    onClick={() => handleCopyPhone(item.phone)}
                                    title="Copy phone"
                                    className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                                  >
                                    {copiedPhone === item.phone ? (
                                      <Check className="w-3 h-3 text-[#5C8A3A]" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {item.type === 'duplicate' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-[#D89C2B] border border-amber-200/80">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Duplicate Skipped</span>
                                </span>
                              )}
                              {item.type === 'validation_error' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-[#B23A2E] border border-rose-200/80">
                                  <XCircle className="w-3 h-3" />
                                  <span>Validation Error</span>
                                </span>
                              )}
                              {item.type === 'imported' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-[#5C8A3A] border border-emerald-200/80">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Imported</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-stone-700 max-w-xs">
                              <div className="text-[11px] font-medium leading-relaxed">
                                {item.reason}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                                {item.campaign_name || '—'}
                              </span>
                            </td>
                            <td className="p-3 text-stone-600 text-[11px] whitespace-nowrap">
                              <div>{item.company || '—'}</div>
                              {item.city && item.city !== '—' && (
                                <div className="text-[10px] text-stone-400">{item.city}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload Area and Mapping Form */
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative p-8 sm:p-12 border-2 border-dashed rounded-3xl text-center transition-all bg-white ${dragActive
                    ? 'border-[#E8622C] bg-[#E8622C]/5 scale-[1.01]'
                    : file
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-stone-300 hover:border-[#E8622C]/60'
                  }`}
              >
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${file ? 'bg-emerald-100 text-[#5C8A3A]' : 'bg-[#E8622C]/10 text-[#E8622C]'
                    }`}>
                    {file ? <FileCheck className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                  </div>

                  {file ? (
                    <div>
                      <div className="font-bold text-sm text-[#2B2B2B]">{file.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • {previewData ? `${previewData.totalRows} records loaded` : 'Parsing...'}
                      </div>
                      <label
                        htmlFor="excel-file-input"
                        className="mt-3 inline-block text-xs font-semibold text-[#E8622C] hover:text-[#d05321] cursor-pointer"
                      >
                        Choose a different file
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-base text-[#2B2B2B]">
                        Drag and drop your spreadsheet here
                      </div>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm">
                        Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats.
                      </p>
                      <label
                        htmlFor="excel-file-input"
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8622C] hover:bg-[#d05321] text-white rounded-xl text-xs font-bold shadow-md shadow-[#E8622C]/20 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Browse Files</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Column Mapping Section */}
              {previewData && (
                <div className="bg-white p-6 rounded-3xl border border-[#E2DDD6] shadow-xs space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#2B2B2B]">Column Mapping</h3>
                      <p className="text-xs text-stone-500">
                        Match the columns in your file with system lead attributes.
                      </p>
                    </div>

                    {/* Optional default campaign & assignment */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-[#E8622C]" />
                        <span className="text-xs font-medium text-stone-700">Default Campaign:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={defaultCampaignName}
                            onChange={(e) => setDefaultCampaignName(e.target.value)}
                            list="previous-campaigns-list"
                            placeholder="e.g. Meta Ads - Corporate NFC"
                            className="w-44 sm:w-52 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                          />
                          <datalist id="previous-campaigns-list">
                            {availableCampaigns.map((camp) => (
                              <option key={camp} value={camp} />
                            ))}
                          </datalist>

                          {availableCampaigns.length > 0 && (
                            <select
                              value={availableCampaigns.includes(defaultCampaignName) ? defaultCampaignName : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setDefaultCampaignName(e.target.value);
                                }
                              }}
                              className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 cursor-pointer transition-colors"
                              title="Select from previously added campaigns"
                            >
                              <option value="">▼ Select Previous ({availableCampaigns.length})</option>
                              {availableCampaigns.map((camp) => (
                                <option key={camp} value={camp}>
                                  {camp}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#E8622C]" />
                        <span className="text-xs font-medium text-stone-700">Assign all to:</span>
                        <select
                          value={defaultAssignedTo}
                          onChange={(e) => setDefaultAssignedTo(e.target.value)}
                          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                        >
                          <option value="">— Leave Unassigned —</option>
                          {salesUsers.filter(u => u.is_active).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mapping Selectors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {standardFields.map((field) => (
                      <div key={field.key} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-[#2B2B2B]">
                            {field.label} {field.required && <span className="text-[#B23A2E]">*</span>}
                          </span>
                          {columnMapping[field.key] ? (
                            <span className="text-[10px] text-[#5C8A3A] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200/60">
                              Mapped
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400">Unmapped</span>
                          )}
                        </div>

                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                        >
                          <option value="">— Select File Header —</option>
                          {previewData.headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* 10 Rows Preview Table */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-[#2B2B2B]">
                      Preview (First {previewData.preview.length} Rows)
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-200">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold">
                            <th className="p-2.5 w-10 text-center">#</th>
                            {previewData.headers.map((h) => (
                              <th key={h} className="p-2.5 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {previewData.preview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className="p-2.5 text-center text-stone-400 font-mono">{idx + 1}</td>
                              {previewData.headers.map((h) => (
                                <td key={h} className="p-2.5 whitespace-nowrap text-stone-700">
                                  {String(row[h] || '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Execution Action Button */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                    <button
                      onClick={resetAll}
                      className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      disabled={importing || !columnMapping.phone}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#E8622C] hover:bg-[#d05321] text-white rounded-xl text-xs font-bold shadow-md shadow-[#E8622C]/20 disabled:opacity-50 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>
                        {importing
                          ? 'Importing & Validating...'
                          : `Import ${previewData.totalRows} Leads`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
