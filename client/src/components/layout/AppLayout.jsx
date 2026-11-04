import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export function AppLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="proxispeak-app-shell">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Container */}
      <div className="app-main-viewport">
        <TopNavbar onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="app-content-body">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
