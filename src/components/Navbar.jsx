import React from 'react';
import { Menu, Plus, Calendar, Bell, Shield, User, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  currentTab, 
  setIsOpen, 
  onOpenAddModal, 
  onExportExcel 
}) {
  const { user, isAdmin } = useAuth();

  const titles = {
    dashboard: 'Performance Dashboard',
    leads: isAdmin ? 'Leads Directory' : 'My Assigned Leads',
    upload: 'Bulk Excel Upload',
    users: 'Sales Team Management'
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E2DDD6] px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#2B2B2B] hover:text-black hover:bg-[#EBE8E3] rounded-lg lg:hidden"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#2B2B2B] tracking-tight">
            {titles[currentTab] || 'Lead Tracker'}
          </h1>
          <p className="hidden sm:block text-xs text-[#8C8782] font-medium">
            {isAdmin ? 'System Administrator Portal' : 'Sales Representative Workspace'}
          </p>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EBE8E3] text-[#2B2B2B] text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#8C8782]" />
          <span>{todayStr}</span>
        </div>

        {/* Action: Add Lead (Admin only or all) */}
        {isAdmin && currentTab === 'leads' && onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E8622C] hover:bg-[#D0521F] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-[#E8622C]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        )}

        {/* User Mini Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2DDD6]">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#2B2B2B]">{user?.name}</div>
            <div className="text-[10px] text-[#8C8782] font-medium">{user?.phone || user?.email}</div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
            isAdmin ? 'bg-[#E8622C]' : 'bg-[#5C8A3A]'
          }`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
