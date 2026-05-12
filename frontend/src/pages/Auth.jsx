import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'login');
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.username, form.email, form.password, form.full_name);
      toast.success('Account created! Check your email for verification.');
      setTab('login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white placeholder:text-surface-400 text-sm transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 shadow-2xl shadow-primary-500/5">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary-500/25">B</div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {tab === 'login' ? 'Sign in to continue' : 'Join the community'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-surface-100 dark:bg-surface-800 p-1 mb-6">
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Login form */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Email</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Password</label>
                <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-60 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Full Name</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Username</label>
                <input type="text" name="username" required value={form.username} onChange={handleChange} placeholder="johndoe" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Email</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Password</label>
                <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={inputClass} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-60 text-sm">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
