import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  UserCheck, 
  Plus, 
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav({ 
  currentTab, 
  setTab, 
  onOpenAddModal 
}) {
  const { user, isAdmin } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-[#E2DDD6] shadow-2xl lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-[#E8622C] font-bold'
              : 'text-[#8C8782] hover:text-[#2B2B2B]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
            {currentTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8622C] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Dashboard</span>
        </button>

        {/* All Leads Tab */}
        <button
          onClick={() => setTab('leads')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'leads'
              ? 'text-[#E8622C] font-bold'
              : 'text-[#8C8782] hover:text-[#2B2B2B]'
          }`}
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${currentTab === 'leads' ? 'stroke-[2.5]' : ''}`} />
            {currentTab === 'leads' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8622C] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {isAdmin ? 'Leads' : 'My Leads'}
          </span>
        </button>

        {/* Center Action Button (Add Lead for Admin) */}
        {isAdmin && onOpenAddModal && (
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={onOpenAddModal}
              title="Add New Lead"
              className="w-12 h-12 rounded-full bg-linear-to-tr from-[#E8622C] to-[#F17845] text-white flex items-center justify-center shadow-lg shadow-[#E8622C]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Upload Leads Tab (Admin only) */}
        {isAdmin && (
          <button
            onClick={() => setTab('upload')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'upload'
                ? 'text-[#E8622C] font-bold'
                : 'text-[#8C8782] hover:text-[#2B2B2B]'
            }`}
          >
            <div className="relative">
              <FileSpreadsheet className={`w-5 h-5 ${currentTab === 'upload' ? 'stroke-[2.5]' : ''}`} />
              {currentTab === 'upload' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8622C] rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Upload</span>
          </button>
        )}

        {/* Sales Team Tab (Admin) */}
        {isAdmin && (
          <button
            onClick={() => setTab('users')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'users'
                ? 'text-[#E8622C] font-bold'
                : 'text-[#8C8782] hover:text-[#2B2B2B]'
            }`}
          >
            <div className="relative">
              <UserCheck className={`w-5 h-5 ${currentTab === 'users' ? 'stroke-[2.5]' : ''}`} />
              {currentTab === 'users' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8622C] rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Team</span>
          </button>
        )}

        {/* For Sales Reps: User badge indicator */}
        {!isAdmin && (
          <div className="flex flex-col items-center justify-center flex-1 py-1 text-[#5C8A3A]">
            <div className="w-5 h-5 rounded-full bg-[#F0F6EB] flex items-center justify-center text-[10px] font-bold text-[#5C8A3A]">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span className="text-[10px] mt-1 font-semibold truncate max-w-[60px]">
              {user?.name?.split(' ')[0] || 'Sales'}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
