import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import UploadLeadsPage from './pages/UploadLeadsPage';
import UsersPage from './pages/UsersPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';

function SplashScreen() {
  const [slowMessage, setSlowMessage] = useState(false);

  useEffect(() => {
    // After 3s show "waking up server" hint
    const t = setTimeout(() => setSlowMessage(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        {/* Logo / Brand */}
        <div className="w-14 h-14 rounded-2xl bg-[#E8622C] flex items-center justify-center mb-1 shadow-lg">
          <span className="text-white text-2xl font-black">P</span>
        </div>
        <div className="text-base font-bold text-white tracking-wide">Printo Cards & Technologies</div>

        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-[#E8622C] border-t-transparent rounded-full animate-spin mt-2" />

        {/* Adaptive message */}
        {slowMessage ? (
          <div className="space-y-1 mt-1">
            <p className="text-xs font-semibold text-[#E8622C]">Waking up server...</p>
            <p className="text-[11px] text-[#6B6560]">This takes ~15 sec on first load. Please wait.</p>
          </div>
        ) : (
          <p className="text-xs text-[#8C8782] mt-1">Loading your workspace...</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leadsFilter, setLeadsFilter] = useState({});
  const [openAddModalTrigger, setOpenAddModalTrigger] = useState(0);

  if (loading) {
    return <SplashScreen />;
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Helper to transition from dashboard KPI card to filtered leads tab
  const handleNavigateToLeads = (filter = {}) => {
    setLeadsFilter(filter);
    setCurrentTab('leads');
  };

  // Guard tabs against non-admin
  const renderCurrentTab = () => {
    if (currentTab === 'dashboard') {
      return <DashboardPage onNavigateToLeads={handleNavigateToLeads} />;
    }
    if (currentTab === 'leads') {
      return (
        <LeadsPage
          key={JSON.stringify(leadsFilter)}
          initialFilter={leadsFilter}
          openAddModalTrigger={openAddModalTrigger}
        />
      );
    }
    if (currentTab === 'upload') {
      return isAdmin ? (
        <UploadLeadsPage onNavigateToLeads={handleNavigateToLeads} />
      ) : (
        <DashboardPage onNavigateToLeads={handleNavigateToLeads} />
      );
    }
    if (currentTab === 'users') {
      return isAdmin ? (
        <UsersPage onNavigateToLeads={handleNavigateToLeads} />
      ) : (
        <DashboardPage onNavigateToLeads={handleNavigateToLeads} />
      );
    }
    return <DashboardPage onNavigateToLeads={handleNavigateToLeads} />;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2B2B2B] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => {
          setLeadsFilter({});
          setCurrentTab(tab);
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          setIsOpen={setIsSidebarOpen}
          onOpenAddModal={() => setOpenAddModalTrigger(prev => prev + 1)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8 max-w-7xl w-full mx-auto">
          {renderCurrentTab()}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          currentTab={currentTab}
          setTab={(tab) => {
            setLeadsFilter({});
            setCurrentTab(tab);
          }}
          onOpenAddModal={() => {
            setCurrentTab('leads');
            setOpenAddModalTrigger(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}
