import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import UploadLeadsPage from './pages/UploadLeadsPage';
import UsersPage from './pages/UsersPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leadsFilter, setLeadsFilter] = useState({});
  const [openAddModalTrigger, setOpenAddModalTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8622C] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-[#8C8782]">
            Initializing Printo Cards And Technologies...
          </span>
        </div>
      </div>
    );
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
