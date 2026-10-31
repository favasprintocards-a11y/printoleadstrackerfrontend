import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  Power, 
  Edit, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  X, 
  Save, 
  AlertCircle,
  AlertTriangle,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export default function UsersPage({ onNavigateToLeads }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales',
    password: ''
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  // Delete User Modal
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [reassignToUserId, setReassignToUserId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await userApi.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', role: 'sales', password: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email && !u.email.endsWith('@printo.local') ? u.email : '',
      phone: u.phone || '',
      role: u.role,
      password: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setModalError('Name and mobile number are required.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setModalError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      if (editingUser) {
        await userApi.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        });
      } else {
        await userApi.createUser(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    if (userToToggle.id === currentUser?.id) {
      alert('You cannot deactivate your own administrator account.');
      return;
    }

    try {
      await userApi.toggleStatus(userToToggle.id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to change status.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    try {
      setResetting(true);
      await userApi.resetPassword(resetModalUser.id, newPassword);
      setResetSuccess('Password reset successfully!');
      setTimeout(() => {
        setResetModalUser(null);
        setNewPassword('');
        setResetSuccess('');
      }, 1500);
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await userApi.deleteUser(deleteModalUser.id, reassignToUserId ? parseInt(reassignToUserId, 10) : null);
      setDeleteModalUser(null);
      setReassignToUserId('');
      fetchUsers();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2B2B2B] tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E8622C]" />
            <span>Sales Team & User Management</span>
          </h2>
          <p className="text-xs text-[#8C8782] mt-0.5">
            Manage sales representatives, assign incoming Meta leads, reset passwords, or remove team members.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-bold shadow-md shadow-[#E8622C]/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Sales Representative</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[#8C8782] text-xs">
            Loading sales team roster...
          </div>
        ) : users.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#8C8782] text-xs">
            No team members found.
          </div>
        ) : (
          users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition-all ${
                  u.is_active ? 'border-[#E2DDD6]' : 'border-[#E2DDD6] bg-[#FAF8F5]/60 opacity-80'
                }`}
              >
                {/* User Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                      u.role === 'admin'
                        ? 'bg-[#2B2B2B] text-white'
                        : 'bg-[#FDF1EB] text-[#E8622C] border border-[#F8DCD0]'
                    }`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#2B2B2B] flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-[#E8622C] bg-[#FDF1EB] px-1.5 py-0.2 rounded-md border border-[#F8DCD0]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-[#2B2B2B] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#E8622C] shrink-0" />
                        <span>{u.phone || 'No mobile'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    u.is_active
                      ? 'bg-[#F0F6EB] text-[#5C8A3A] border-[#D3E5C7]'
                      : 'bg-[#FBF0EF] text-[#B23A2E] border-[#E8BDB8]'
                  }`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details & Performance Badges */}
                <div className="mt-4 pt-3 border-t border-[#E2DDD6]/60 space-y-2 text-xs">
                  {u.email && !u.email.endsWith('@printo.local') && (
                    <div className="flex items-center gap-2 text-[#8C8782]">
                      <Mail className="w-3.5 h-3.5 text-[#8C8782]" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  )}

                  {/* Performance Strip */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E2DDD6] text-xs">
                    <span>Role: <strong className="capitalize text-[#2B2B2B]">{u.role}</strong></span>
                    <span>Assigned: <strong className="text-[#E8622C]">{u.assigned_leads_count || 0}</strong></span>
                    <span>Won: <strong className="text-[#5C8A3A]">{u.won_leads_count || 0}</strong></span>
                    {u.assigned_leads_count > 0 && (
                      <span className="font-bold text-[#5C8A3A] text-[11px] bg-[#F0F6EB] px-1.5 py-0.5 rounded border border-[#D3E5C7]">
                        {Math.round(((u.won_leads_count || 0) / u.assigned_leads_count) * 100)}% Win
                      </span>
                    )}
                  </div>

                  {/* View Leads Quick Navigation */}
                  {onNavigateToLeads && u.role === 'sales' && (
                    <button
                      onClick={() => onNavigateToLeads({ assigned_to: u.id })}
                      className="w-full py-1.5 bg-[#FAF8F5] hover:bg-[#FDF1EB] text-[#2B2B2B] hover:text-[#E8622C] border border-[#E2DDD6] hover:border-[#E8622C]/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Assigned Leads ({u.assigned_leads_count || 0})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E8622C]" />
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#E2DDD6]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(u)}
                      title="Edit user details"
                      className="p-1.5 text-[#8C8782] hover:text-[#E8622C] hover:bg-[#FDF1EB] rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setResetModalUser(u);
                        setNewPassword('');
                        setResetError('');
                        setResetSuccess('');
                      }}
                      title="Reset Password"
                      className="p-1.5 text-[#8C8782] hover:text-[#D89C2B] hover:bg-[#FDF7EA] rounded-lg transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    {/* Delete Sales Person Option */}
                    {!isSelf && (
                      <button
                        onClick={() => {
                          setDeleteModalUser(u);
                          setReassignToUserId('');
                          setDeleteError('');
                        }}
                        title="Delete sales representative"
                        className="p-1.5 text-[#8C8782] hover:text-[#B23A2E] hover:bg-[#FBF0EF] rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                        u.is_active
                          ? 'text-[#B23A2E] hover:bg-[#FBF0EF] border border-[#E8BDB8]'
                          : 'text-[#5C8A3A] hover:bg-[#F0F6EB] border border-[#D3E5C7]'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2DDD6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2DDD6] flex items-center justify-between bg-[#FAF8F5]">
              <h3 className="text-base font-bold text-[#2B2B2B]">
                {editingUser ? 'Edit User Details' : 'Add New Team Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#8C8782] hover:text-[#2B2B2B] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-3.5">
              {modalError && (
                <div className="p-3 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Full Name <span className="text-[#B23A2E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Mobile Number (Login ID) <span className="text-[#B23A2E]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210 or 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Email Address <span className="text-[#8C8782] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="rahul@printo.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 font-medium cursor-pointer"
                >
                  <option value="sales">Sales Representative (Restricted Access)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Initial Password <span className="text-[#B23A2E]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-[#E2DDD6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2DDD6] text-[#2B2B2B] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E2DDD6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2DDD6] flex items-center justify-between bg-[#FAF8F5]">
              <h3 className="text-base font-bold text-[#2B2B2B]">
                Reset Password
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1.5 text-[#8C8782] hover:text-[#2B2B2B] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-[#8C8782]">
                Assign a new password for <strong className="text-[#2B2B2B]">{resetModalUser.name}</strong> (Mobile: {resetModalUser.phone || resetModalUser.email}).
              </p>

              {resetError && (
                <div className="p-3 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-[#F0F6EB] border border-[#D3E5C7] text-[#5C8A3A] text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-[#E2DDD6] text-[#2B2B2B] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sales Person Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2DDD6] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2DDD6] flex items-center justify-between bg-[#FBF0EF]/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#FBF0EF] border border-[#E8BDB8] flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-[#B23A2E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2B2B2B]">
                    Delete Sales Person
                  </h3>
                  <p className="text-[11px] text-[#8C8782]">Remove team member from CRM</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalUser(null)}
                className="p-1.5 text-[#8C8782] hover:text-[#2B2B2B] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* User Summary Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DDD6]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#2B2B2B]">{deleteModalUser.name}</div>
                    <div className="text-xs text-[#8C8782] font-mono mt-0.5">{deleteModalUser.phone || deleteModalUser.email}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-[#FDF1EB] text-[#E8622C] border border-[#F8DCD0]">
                    {deleteModalUser.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E2DDD6] flex items-center justify-between text-xs text-[#8C8782]">
                  <span>Currently Assigned Leads:</span>
                  <span className="font-bold text-[#2B2B2B] text-sm">{deleteModalUser.assigned_leads_count || 0}</span>
                </div>
              </div>

              {/* Reassignment Option if user has leads */}
              {deleteModalUser.assigned_leads_count > 0 ? (
                <div className="space-y-2">
                  <div className="p-3 bg-[#FDF7EA] border border-[#F6E1B6] rounded-xl text-xs text-[#8F661A] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D89C2B]" />
                    <div>
                      <p className="font-bold">Active Leads Assigned</p>
                      <p className="text-[11px] mt-0.5">
                        This sales person has <strong>{deleteModalUser.assigned_leads_count}</strong> assigned leads. You can reassign them to another active team member or leave them unassigned.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Reassign leads to (optional):
                    </label>
                    <select
                      value={reassignToUserId}
                      onChange={(e) => setReassignToUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DDD6] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 cursor-pointer"
                    >
                      <option value="">Leave leads Unassigned</option>
                      {users
                        .filter((u) => u.id !== deleteModalUser.id && u.is_active)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role}) — {u.phone || u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8C8782]">
                  Are you sure you want to delete <strong className="text-[#2B2B2B]">{deleteModalUser.name}</strong>? This user will immediately lose access to the system. This action cannot be undone.
                </p>
              )}

              {/* Footer Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2DDD6]">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  disabled={deleting}
                  className="px-4 py-2 border border-[#E2DDD6] text-[#2B2B2B] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-4 py-2 bg-[#B23A2E] hover:bg-[#942F25] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Deleting...' : 'Delete Sales Person'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
