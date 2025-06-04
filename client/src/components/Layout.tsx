import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ChevronDown, Settings, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserProfileDisplay from './UserProfileDisplay';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export default function Layout({ children, showNavigation = true }: LayoutProps) {
  const { user, logout } = useAuth();
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);

  // Fetch bot info for header logo
  const { data: botInfo } = useQuery({
    queryKey: ['/api/bot/info'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setShowDesktopDropdown(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setShowMobileDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                {(botInfo as any)?.avatar && !imageError ? (
                  <img
                    src={(botInfo as any).avatar}
                    alt="Valkyrion Bot"
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">V</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl">Valkyrion</h1>
                <p className="text-gray-300 text-sm">Premium Discord Radio</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                Home
              </Link>
              <Link to="/features" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                Features
              </Link>
              <Link to="/commands" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                Commands
              </Link>
              <Link to="/server-selection" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                Control Panel
              </Link>
              <Link to="/changelog" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                Changelog
              </Link>
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5">
                About
              </Link>
              <Link 
                to="/invite" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300"
              >
                Invite Bot
              </Link>

              {/* User Profile Section */}
              {user ? (
                <div className="relative" ref={desktopDropdownRef}>
                  <button 
                    onClick={() => setShowDesktopDropdown(!showDesktopDropdown)}
                    className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 hover:border-purple-500/50 transition-all"
                  >
                    <UserProfileDisplay user={user} variant="desktop" showUsername={false} size="sm" />
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                  </button>
                  
                  {showDesktopDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50">
                      <div className="p-4 border-b border-slate-700">
                        <UserProfileDisplay user={user} variant="desktop" showUsername={true} size="md" />
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          onClick={() => setShowDesktopDropdown(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          onClick={() => setShowDesktopDropdown(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setShowDesktopDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a 
                  href="/auth/discord" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Login with Discord
                </a>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {user ? (
                <div className="relative" ref={mobileDropdownRef}>
                  <button 
                    onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <UserProfileDisplay user={user} variant="mobile" showUsername={false} size="sm" />
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showMobileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50">
                      <div className="p-4 border-b border-slate-700">
                        <UserProfileDisplay user={user} variant="mobile" showUsername={true} size="md" />
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          onClick={() => setShowMobileDropdown(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>

                        <Link
                          to="/settings"
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          onClick={() => setShowMobileDropdown(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setShowMobileDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a 
                  href="/auth/discord" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg font-medium text-sm"
                >
                  Login
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 z-40"
          >
            <div className="px-4 py-6 space-y-4">
              <Link 
                to="/" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link 
                to="/features" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Features
              </Link>
              <Link 
                to="/commands" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Commands
              </Link>
              <Link 
                to="/server-selection" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Control Panel
              </Link>
              <Link 
                to="/changelog" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Changelog
              </Link>
              <Link 
                to="/about" 
                className="block text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                About
              </Link>
              <div className="pt-4 border-t border-white/10">
                <Link 
                  to="/invite" 
                  className="block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 text-center"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Invite Bot
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}