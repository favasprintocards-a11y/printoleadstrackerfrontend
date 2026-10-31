const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
let API_BASE = '/api';

if (rawApiUrl) {
  const cleanUrl = rawApiUrl.replace(/\/+$/, '');
  API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

/**
 * Helper to get the saved auth token
 */
export function getStoredToken() {
  return localStorage.getItem('lead_tracker_token');
}

/**
 * Make an authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Handle blob responses (for Excel download)
  if (options.isBlob) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.blob();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return data;
}

// ================= AUTH API =================
export const authApi = {
  login: (phone, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    }),
  getMe: () => apiRequest('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    })
};

// ================= USER MANAGEMENT API (Admin) =================
export const userApi = {
  getUsers: () => apiRequest('/users'),
  createUser: (userData) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  updateUser: (id, userData) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
  toggleStatus: (id) =>
    apiRequest(`/users/${id}/toggle-status`, {
      method: 'PATCH'
    }),
  resetPassword: (id, newPassword) =>
    apiRequest(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),
  deleteUser: (id, reassign_to = null) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reassign_to })
    })
};

// ================= LEADS API =================
export const leadApi = {
  getLeads: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    return apiRequest(`/leads?${query.toString()}`);
  },
  getLead: (id) => apiRequest(`/leads/${id}`),
  createLead: (data) =>
    apiRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateLead: (id, data) =>
    apiRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  addActivity: (id, data) =>
    apiRequest(`/leads/${id}/activity`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteLead: (id) =>
    apiRequest(`/leads/${id}`, {
      method: 'DELETE'
    }),
  bulkAssign: (lead_ids, assigned_to_users, mode = 'distribute') =>
    apiRequest('/leads/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({
        lead_ids,
        assigned_to_users: Array.isArray(assigned_to_users) ? assigned_to_users : [assigned_to_users],
        mode
      })
    }),
  bulkStatus: (lead_ids, status, note) =>
    apiRequest('/leads/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ lead_ids, status, note })
    }),
  bulkCampaign: (lead_ids, campaign_name) =>
    apiRequest('/leads/bulk-campaign', {
      method: 'POST',
      body: JSON.stringify({ lead_ids, campaign_name })
    }),
  getCampaigns: () => apiRequest('/leads/meta/campaigns'),
  bulkDelete: (lead_ids) =>
    apiRequest('/leads/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ lead_ids })
    }),
  downloadTemplate: async () => {
    const blob = await apiRequest('/leads/template', { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_upload_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },
  previewUpload: (formData) =>
    apiRequest('/leads/upload/preview', {
      method: 'POST',
      body: formData
    }),
  executeImport: (data) =>
    apiRequest('/leads/upload/import', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  downloadErrorReport: async (errors, duplicates) => {
    const blob = await apiRequest('/leads/upload/error-report', {
      method: 'POST',
      body: JSON.stringify({ errors, duplicates }),
      isBlob: true
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_issues_report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },
  getImportHistory: () => apiRequest('/leads/upload/history'),
  getImportIssues: (batchId) => apiRequest(`/leads/upload/history/${batchId}/issues`),
  getLatestImportIssues: () => apiRequest('/leads/upload/issues/latest'),
  exportLeads: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const blob = await apiRequest(`/leads/export?${query.toString()}`, { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// ================= DASHBOARD API =================
export const dashboardApi = {
  getStats: (campaign) => {
    const query = campaign && campaign !== 'all' ? `?campaign=${encodeURIComponent(campaign)}` : '';
    return apiRequest(`/dashboard/stats${query}`);
  }
};

