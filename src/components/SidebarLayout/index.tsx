import React from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onShare?: () => void;
  onLogout?: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  children,
  onShare,
  onLogout 
}) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* System Header */}
        <Header 
          onShare={onShare}
          onLogout={onLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
