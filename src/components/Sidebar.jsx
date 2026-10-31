import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  UserCheck, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }) {
  const { user, logout, isAdmin } = useAuth();

  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'sales']
    },
    {
      id: 'leads',
      name: 'All Leads',
      icon: Users,
      roles: ['admin', 'sales']
    },
    {
      id: 'upload',
      name: 'Upload Leads',
      icon: FileSpreadsheet,
      roles: ['admin']
    },
    {
      id: 'users',
      name: 'Sales Team',
      icon: UserCheck,
      roles: ['admin']
    }
  ];

  const allowedNav = navigation.filter(item => item.roles.includes(user?.role || 'sales'));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1A1A1A] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-[#2B2B2B] shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-[#2B2B2B] bg-[#141414]">
          <img
            src="/logo.png"
            alt="Printo Cards & Technologies"
            className="h-12 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#8C8782]">
            Menu
          </div>

          {allowedNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/30 font-semibold'
                    : 'text-[#EBE8E3] hover:text-white hover:bg-[#2B2B2B]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8C8782]'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#2B2B2B] bg-[#141414]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-[#E8622C] text-white font-bold flex items-center justify-center text-sm ring-2 ring-[#2B2B2B]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    isAdmin
                      ? 'bg-[#E8622C]/20 text-[#E8622C] border border-[#E8622C]/30'
                      : 'bg-[#A8C93C]/20 text-[#A8C93C] border border-[#A8C93C]/30'
                  }`}
                >
                  {user?.role === 'admin' ? 'Administrator' : 'Sales Rep'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-[#8C8782] hover:text-[#B23A2E] hover:bg-[#2B2B2B] rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
