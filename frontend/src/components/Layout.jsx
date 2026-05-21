import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, navLinks }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ---- Overlay (mobile only) ---- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Brand + close button (mobile) */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-blue-600">
              Dayspring<span className="text-gray-800"> Hub</span>
            </h2>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  link.onClick?.();
                  closeSidebar();            // always close on mobile
                }}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                {link.icon && <span className="text-xl">{link.icon}</span>}
                {link.label}
              </button>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="border-t pt-4 mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                {user?.full_name?.charAt(0) ||
                  user?.display_name?.charAt(0) ||
                  'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {user?.full_name || user?.display_name}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ---- Main content area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-blue-600">
            Dayspring<span className="text-gray-800"> Hub</span>
          </h2>
          <div className="w-6" /> {/* spacer to keep title centred */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}