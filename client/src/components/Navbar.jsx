import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Ticket, LayoutDashboard, Shield, User, Menu, X, Search } from 'lucide-react';

const Navbar = () => {
  const { user, logout, notifications, setNotifications } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.length;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category')?.toLowerCase() || '';

  const navLinks = ['Concerts', 'Sports', 'Comedy', 'Music', 'Exhibitions'];

  return (
    <nav className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 px-6 py-4 ${
      isScrolled 
        ? 'backdrop-blur-xl bg-[#030305]/80 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)]' 
        : 'bg-transparent border-b border-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Links */}
        <div className="flex items-center space-x-12">
          <Link to="/" className="text-2xl font-black tracking-tight text-white">
            TicketWave
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
            {navLinks.map((link) => (
              <Link 
                key={link}
                to={`/?category=${link}`} 
                className={
                  currentCategory === link.toLowerCase()
                    ? "text-white border-b-2 border-indigo-500 pb-1"
                    : "text-slate-400 hover:text-white transition-colors"
                }
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
        {/* Sockets / Auth / Notification Dropdown Controls */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Global Search Bar (from mock-up) */}
          <div className="relative mr-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search events..." className="bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 w-64" />
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/my-bookings" className="text-sm font-semibold text-slate-300 hover:text-white">My Bookings</Link>
              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link to="/dashboard" className="text-sm font-semibold text-slate-300 hover:text-white">Dashboard</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="text-sm font-semibold text-slate-300 hover:text-white">Admin</Link>
              )}
              
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full relative transition-all"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-rose-500 rounded-full animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-500 text-sm">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                          >
                            <p className="text-xs text-slate-200 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">Just now</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info Badge */}
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl">
                <User className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-none">{user.name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold mt-0.5">{user.role}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-full transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>

            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors font-semibold">Sign In</Link>
              <Link to="/register" className="premium-btn py-2 text-sm">
                Create Event
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger toggle */}
        <div className="md:hidden flex items-center space-x-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-white rounded-full relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
                  <div className="px-3 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center text-xs">
                    <span className="font-semibold">Notifications</span>
                    <button onClick={clearNotifications} className="text-teal-400">Clear</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">No notifications</div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="p-3 border-b border-white/5 last:border-b-0 text-xs">
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col space-y-4">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium">Explore Events</Link>
          {user ? (
            <>
              <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium">My Bookings</Link>
              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium">Organizer Dashboard</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium">Admin Panel</Link>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Logged as: {user.name} ({user.role})</span>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="flex items-center space-x-1 text-xs text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2.5 rounded-xl border border-white/10 text-center font-medium">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-2.5 bg-teal-600 rounded-xl text-center text-white font-medium shadow-lg">
                Join Wave
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
