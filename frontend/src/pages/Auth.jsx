import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SEO from '../components/common/SEO';

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

  const inputClass = "w-full px-6 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white placeholder:text-surface-400 text-sm font-bold transition-all outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-20">
      <SEO 
        title={tab === 'login' ? 'Login' : 'Sign Up'} 
        description="Join the BlogVerse community to share your technology insights and creative stories with the world."
      />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg">
        <div className="glassium-card glint-border p-10 sm:p-14 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-xl">B</div>
            <h1 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">
              {tab === 'login' ? 'Welcome Back' : 'Join the Verse'}
            </h1>
            <p className="text-surface-500 font-bold mt-2">
              {tab === 'login' ? 'Enter the digital reflection' : 'Start your high-end journey'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-2xl glassium glint-border p-1.5 mb-10">
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-black rounded-[1.25rem] transition-all uppercase tracking-widest ${tab === t ? 'bg-white dark:bg-white/10 shadow-lg text-primary-600 dark:text-primary-400' : 'text-surface-400 hover:text-surface-600'}`}>
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Login form */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Email Address</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Password</label>
                <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
              </div>
              <button type="submit" disabled={loading}
                className="btn-glassium-primary w-full py-4 text-lg">
                {loading ? 'Entering...' : 'Enter Now'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Full Name</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Username</label>
                  <input type="text" name="username" required value={form.username} onChange={handleChange} placeholder="johndoe" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Email</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-surface-500 uppercase tracking-widest mb-2 px-2">Secure Password</label>
                <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={inputClass} />
              </div>
              <button type="submit" disabled={loading}
                className="btn-glassium-primary w-full py-4 text-lg">
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
