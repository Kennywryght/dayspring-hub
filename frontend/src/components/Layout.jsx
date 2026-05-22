import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, navLinks }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      {/* ---- Overlay (mobile only) ---- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white/90 backdrop-blur-xl shadow-2xl border-r border-gray-200/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Brand + close button (mobile) */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                D
              </div>
              <span className="text-2xl font-black text-gray-900">
                Dayspring
                <span className="text-blue-600"> Hub</span>
              </span>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 space-y-1.5">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  link.onClick?.();
                  closeSidebar();            // always close on mobile
                }}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 font-medium group"
              >
                {link.icon ? (
                  <span className="text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
                ) : (
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
                {link.label}
              </button>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="border-t border-gray-200 pt-6 mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                {user?.full_name?.charAt(0) ||
                  user?.display_name?.charAt(0) ||
                  'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.full_name || user?.display_name}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[160px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ---- Main content area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60 p-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow">D</div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Dayspring<span className="text-blue-600"> Hub</span>
            </h2>
          </div>
          <div className="w-8" /> {/* spacer to keep title centred */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in-up">
          {children}
        </main>
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
      `}</style>
    </div>
  );
}