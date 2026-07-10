import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, 
  Search, 
  FileEdit, 
  History, 
  LogOut, 
  User, 
  MapPin, 
  Building2,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'HCP Search', href: '/search', icon: Search },
    { name: 'Log Interaction', href: '/log', icon: FileEdit },
    { name: 'Review', href: '/review', icon: FileText },
    { name: 'History', href: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Upper Navigation Header (Static Dark Theme) */}
      <header className="sticky top-0 z-40 w-full border-b border-darkslate-800/80 bg-darkslate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                A
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-darkslate-400 bg-clip-text text-transparent">
                AI-First CRM <span className="text-xs text-indigo-400 font-medium">HCP Module</span>
              </span>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-darkslate-900 text-indigo-400 border border-darkslate-800'
                        : 'text-darkslate-400 hover:text-darkslate-200 hover:bg-darkslate-900/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Header Side (User Profile) */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-semibold text-darkslate-300">{user.name}</span>
                    <span className="text-[10px] text-darkslate-500 font-medium flex items-center gap-1 justify-end">
                      <MapPin className="h-2.5 w-2.5" /> {user.territory}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full border border-darkslate-800 bg-darkslate-900 flex items-center justify-center text-indigo-400">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body (Dynamic Light Theme) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer (Dynamic Light Theme) */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>AI-First CRM for Pharmaceutical Representatives</span>
          <span>© 2026 PharmaCorp. Production Build.</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
