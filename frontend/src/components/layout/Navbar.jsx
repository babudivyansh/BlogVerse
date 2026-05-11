import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineMenu, HiOutlineX, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/25">
              B
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">BlogVerse</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-4 py-2 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-all">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={handleSearch}
                  className="hidden md:flex overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search blogs..."
                    className="w-full px-4 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white"
                  />
                </motion.form>
              )}
            </AnimatePresence>
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
              <HiOutlineSearch className="w-5 h-5" />
            </button>

            {/* Theme toggle */}
            <button onClick={toggle}
              className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
              {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-semibold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 py-2 rounded-2xl glass-card shadow-xl shadow-black/10"
                    >
                      <div className="px-4 py-3 border-b border-surface-200/50 dark:border-white/5">
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{user.full_name || user.username}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/create" onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors">
                        Write Blog
                      </Link>
                      <Link to={`/profile/${user.username}`} onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors">
                        Profile
                      </Link>
                      {user.is_admin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors">
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-surface-200/50 dark:border-white/5 mt-1 pt-1">
                        <button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/auth?tab=login"
                  className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Login
                </Link>
                <Link to="/auth?tab=signup"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
              {mobileOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              <form onSubmit={handleSearch} className="mb-3">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search blogs..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white"
                />
              </form>
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors">
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link to="/auth?tab=login" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200">
                    Login
                  </Link>
                  <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl">
                    Sign Up
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
