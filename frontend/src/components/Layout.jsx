import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  ClipboardList,
  Megaphone,
  GraduationCap,
  PenSquare,
  School,
  BookMarked,
  Users,
  UserRound,
  Link2,
  BarChart3,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Circle,
  Lock,
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

export default function Layout({ children, navLinks }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { counts, clearNotifications } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const totalNotifications = Object.values(counts).reduce((sum, c) => sum + (c || 0), 0);

  // Professional icon set, resolved by nav label — replaces emoji entirely
  const getIcon = (label) => {
    const icons = {
      'Home': Home,
      'Materials': BookOpen,
      'Assignments': ClipboardList,
      'Announcements': Megaphone,
      'Students': GraduationCap,
      'Quizzes': PenSquare,
      'Classes': School,
      'Subjects': BookMarked,
      'Teachers': Users,
      'Parents': UserRound,
      'Assign': Link2,
      'Link Parent': Link2,
      'Stats': BarChart3,
    };
    return icons[label] || Circle;
  };

  // Role badge — Meridian palette, replaces purple/emerald/cyan/red
  const getRoleBadge = (role) => {
    const badges = {
      'teacher': 'bg-brass-100 dark:bg-brass-900/30 text-brass-700 dark:text-brass-300',
      'student': 'bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500',
      'parent': 'bg-navy-100 dark:bg-navy-500/20 text-navy-600 dark:text-navy-200',
      'super_admin': 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-600 dark:text-oxbrick-500',
    };
    return badges[role] || 'bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300';
  };

  return (
    <div className="min-h-screen flex bg-parchment dark:bg-navy-900 transition-colors duration-300">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — Fixed position, doesn't scroll with content */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-navy-800 shadow-elevated transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand + horizon line signature - Fixed at top */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded overflow-hidden border border-brass-500/40 flex-shrink-0 bg-white">
                <img src="/logo.jpg" alt="Dayspring Hub" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <p className="text-lg font-display font-semibold text-white tracking-tight">Dayspring</p>
                <p className="text-xs font-sans text-brass-300 uppercase tracking-widest">Hub</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-navy-300 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Horizon line — the signature element */}
          <div className="h-px bg-gradient-to-r from-transparent via-brass-500 to-transparent opacity-70" />
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
          <p className="px-4 py-2 text-xs font-semibold text-navy-400 uppercase tracking-wider">
            Navigation
          </p>

          {navLinks.map((link) => {
            const Icon = getIcon(link.label);
            return (
              <button
                key={link.label}
                onClick={() => {
                  link.onClick?.();
                  closeSidebar();
                }}
                className="w-full text-left px-4 py-2.5 rounded flex items-center gap-3 text-navy-200 hover:bg-navy-700 hover:text-white transition-colors duration-150 font-medium text-sm group relative"
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-brass-500 group-hover:h-6 transition-all duration-200" />
                <Icon className="w-4 h-4 flex-shrink-0 text-navy-400 group-hover:text-brass-400 transition-colors duration-150" strokeWidth={1.75} />
                <span>{link.label}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-brass-400" strokeWidth={2} />
              </button>
            );
          })}
        </nav>

        {/* Bottom section - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-navy-700">
          <div className="px-3 py-3 space-y-0.5">
            <button
              onClick={clearNotifications}
              className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded text-navy-200 hover:bg-navy-700 hover:text-white transition-colors duration-150 text-sm"
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              <span>Notifications</span>
              {totalNotifications > 0 && (
                <span className="ml-auto bg-oxbrick-600 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-semibold">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Theme Toggle - Improved with smooth animations */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-navy-200 hover:bg-navy-700 hover:text-white transition-colors duration-150 text-sm group"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <Sun 
                  className={`w-4 h-4 absolute transition-all duration-500 transform ${
                    dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                  }`} 
                  strokeWidth={1.75} 
                />
                <Moon 
                  className={`w-4 h-4 absolute transition-all duration-500 transform ${
                    dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                  }`} 
                  strokeWidth={1.75} 
                />
              </div>
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
              <span className={`ml-auto w-10 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${
                dark ? 'bg-brass-500' : 'bg-navy-600'
              }`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                  dark ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </span>
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-navy-200 hover:bg-navy-700 hover:text-white transition-colors duration-150 text-sm"
            >
              <Lock className="w-4 h-4" strokeWidth={1.75} />
              <span>Change Password</span>
            </button>
          </div>

          {/* User info - Fixed at bottom */}
          <div className="px-5 py-4 border-t border-navy-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-navy-600 border border-brass-500/30 flex items-center justify-center font-display font-semibold text-brass-300 flex-shrink-0 text-sm">
                {user?.full_name?.charAt(0) || user?.display_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.full_name || user?.display_name || 'User'}
                </p>
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${getRoleBadge(user?.role)}`}>
                  {user?.role?.replace('_', ' ') || 'user'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded text-oxbrick-400 hover:bg-oxbrick-700/20 hover:text-oxbrick-300 transition-colors duration-150 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile top bar — fixed at top */}
        <div className="lg:hidden bg-navy-800 p-4 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-navy-300 hover:text-white p-2 rounded transition-colors"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded overflow-hidden border border-brass-500/40">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-base font-display font-semibold text-white">
              Dayspring <span className="text-brass-400">Hub</span>
            </h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Page content - Scrollable area with padding */}
        <main className="flex-1 p-4 md:p-8">
          <div className="animate-fade-in-up max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
        user={user} 
      />
    </div>
  );
}