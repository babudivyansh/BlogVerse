import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineMenu, HiOutlineX, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatImageUrl } from '../../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Explore' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/60 dark:bg-surface-950/60 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(124,93,250,0.08)] border-b border-white/20 dark:border-white/5 transition-all">
      <div className="flex justify-between items-center max-w-[1600px] mx-auto px-8 sm:px-12 py-4">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Blogverse" className="h-48 w-auto object-contain -my-16" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="text-sm font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors duration-300 uppercase tracking-[0.2em]">
                {link.label}
              </Link>
            ))}
            <Link to="/search?category=Technology" className="text-sm font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors duration-300 uppercase tracking-[0.2em]">Trending</Link>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search bar inside nav */}
          <div className="hidden lg:flex items-center glass-input rounded-2xl px-6 py-2.5 mr-4 group focus-within:ring-2 focus-within:ring-primary-400/50 focus-within:bg-white/60 dark:focus-within:bg-white/10 transition-all duration-300">
            <HiOutlineSearch className="w-5 h-5 text-surface-500 dark:text-surface-400 group-focus-within:text-primary-500 transition-colors" />
            <form onSubmit={handleSearch}>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold w-56 text-surface-800 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 ml-2" 
                placeholder="Search insights..." 
              />
            </form>
          </div>

          {/* Theme toggle */}
          <button onClick={toggle}
            className="p-2.5 rounded-full glassium text-surface-500 dark:text-surface-400 hover:scale-110 transition-all active:scale-95 shadow-sm">
            {dark ? <HiOutlineSun className="w-5 h-5 text-amber-400" /> : <HiOutlineMoon className="w-5 h-5" />}
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-black shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                  {user.avatar_url ? (
                    <img 
                      src={formatImageUrl(user.avatar_url)} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = user.username?.[0]?.toUpperCase();
                      }}
                    />
                  ) : (
                    user.username?.[0]?.toUpperCase()
                  )}
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-64 py-3 bg-white dark:bg-surface-900 border border-surface-100 dark:border-white/5 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
                  >
                    <div className="px-5 py-4 border-b border-surface-100 dark:border-white/5">
                      <p className="text-sm font-black text-surface-800 dark:text-white leading-none mb-1">{user.full_name || user.username}</p>
                      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to={`/profile/${user.username}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-surface-600 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                        My Profile
                      </Link>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-surface-600 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                        Dashboard
                      </Link>
                      <Link to="/create" onClick={() => setProfileOpen(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-surface-600 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                        Write Blog
                      </Link>
                      {user.is_admin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-black text-primary-500 hover:bg-primary-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                          Admin Panel
                        </Link>
                      )}
                      <div className="pt-2">
                        <button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="w-full flex items-center px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
                          Logout
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth?tab=login" className="text-sm font-black text-surface-600 dark:text-surface-200 hover:text-primary-500 transition-all uppercase tracking-widest">
                Log In
              </Link>
              <Link to="/auth?tab=signup" className="bg-primary-500 text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-lg shadow-primary-500/20 active:scale-95 hover:shadow-primary-500/40 transition-all">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-xl glassium text-surface-500 dark:text-surface-400 hover:scale-110 transition-all">
            {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden glassium-card rounded-b-[2rem] shadow-2xl border-t border-white/10"
          >
            <div className="p-8 space-y-4">
              <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Blogverse" className="h-32 w-auto object-contain -my-10" />
              </Link>
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className="block text-xl font-black text-surface-800 dark:text-white hover:text-primary-500 transition-all">
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <Link to="/auth?tab=login" onClick={() => setMobileOpen(false)}
                    className="text-center py-4 text-xs font-black uppercase tracking-widest rounded-2xl glassium text-surface-700 dark:text-surface-200">
                    Login
                  </Link>
                  <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}
                    className="bg-primary-500 text-white py-4 text-xs font-black uppercase tracking-widest rounded-2xl text-center shadow-lg shadow-primary-500/20">
                    Join
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
