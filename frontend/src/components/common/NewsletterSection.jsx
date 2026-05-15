import { useState } from 'react';
import { motion } from 'framer-motion';
import { subscribeNewsletter } from '../../services/api';
import toast from 'react-hot-toast';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    try {
      setSubscribing(true);
      const res = await subscribeNewsletter(email);
      toast.success(res.data.message || 'Successfully subscribed!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Orbs for Ambient Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto glassium-card glint-border p-12 md:p-20 text-center relative overflow-hidden"
      >
        {/* Subtle Decorative Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 font-heading tracking-tight">
            Elevate Your Inbox
          </h2>
          <p className="text-lg md:text-xl text-surface-500 dark:text-surface-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Weekly insights and stories, delivered with glass-like clarity.
          </p>

          <form onSubmit={handleSubscribe} className="max-w-xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-8 py-5 rounded-2xl glassium glint-border focus:ring-4 focus:ring-primary-500/20 text-lg font-bold outline-none transition-all placeholder:text-surface-400"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={subscribing}
              className="px-12 py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-600/20 hover:shadow-primary-600/40 transition-all active:scale-95 whitespace-nowrap text-lg tracking-wider disabled:opacity-70"
            >
              {subscribing ? 'Joining...' : 'Subscribe'}
            </button>
          </form>
          
          <p className="mt-8 text-xs font-bold text-surface-400 uppercase tracking-[0.2em]">
            Zero Spam • Weekly Digest • Unsubscribe Anytime
          </p>
        </div>
      </motion.div>
    </section>
  );
}
