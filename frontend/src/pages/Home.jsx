import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineGlobe } from 'react-icons/hi';
import BlogCard from '../components/blog/BlogCard';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import { getBlogs, getFeaturedBlogs, getCategories, subscribeNewsletter } from '../services/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function load() {
      try {
        const [featRes, latestRes, catRes] = await Promise.allSettled([
          getFeaturedBlogs(),
          getBlogs({ page: 1, limit: 9 }),
          getCategories(),
        ]);
        if (featRes.status === 'fulfilled') setFeatured(featRes.value.data);
        if (latestRes.status === 'fulfilled') setLatest(latestRes.value.data.items);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 mb-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassium glint-border text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest mb-10">
              <HiOutlineSparkles className="w-4 h-4 animate-pulse" /> The Future of Digital Expression
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-surface-800 dark:text-white leading-[1] tracking-tight mb-8 font-heading">
              Write with <span className="text-primary-500">Clarity.</span><br />
              Inspire with <span className="text-primary-400">Depth.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-surface-500 dark:text-surface-400 leading-relaxed mb-12 max-w-2xl mx-auto font-medium">
              A high-performance blog platform where your ideas meet an ethereal digital canvas. Powered by Gemini AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/create" className="btn-glassium-primary text-lg px-10">
                Start Creating <HiOutlineArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link to="/search" className="btn-glassium-secondary text-lg px-10">
                Explore Stories
              </Link>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
            {[
              { icon: HiOutlineLightningBolt, title: 'Instant Speed', desc: 'Optimized for performance.' },
              { icon: HiOutlineSparkles, title: 'AI Enhanced', desc: 'Crafted with Gemini AI.' },
              { icon: HiOutlineGlobe, title: 'Global Reach', desc: 'Share with the world.' },
            ].map((f, i) => (
              <div key={i} className="p-8 glassium-card glint-border text-left">
                <f.icon className="w-10 h-10 text-primary-500 mb-6" />
                <h3 className="text-xl font-black text-surface-800 dark:text-white mb-2 font-heading">{f.title}</h3>
                <p className="text-surface-500 dark:text-surface-400 font-medium">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Blogs ───────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-surface-800 dark:text-white font-heading">Editor's Choice</h2>
              <p className="text-surface-500 font-bold uppercase tracking-wider text-xs mt-2">The best of BlogVerse</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featured.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
          </div>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="glassium-card glint-border p-10 sm:p-16">
            <h2 className="text-3xl font-black text-surface-800 dark:text-white mb-10 font-heading">Explore by Category</h2>
            <div className="flex flex-wrap gap-4">
              {categories.map(cat => (
                <Link key={cat.name} to={`/search?category=${cat.name}`}
                  className="px-6 py-3 rounded-[1.25rem] text-sm font-black glassium hover:bg-primary-500 hover:text-white transition-all transform hover:-translate-y-1">
                  {cat.name} <span className="opacity-50 ml-2 font-bold">{cat.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Blogs ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-surface-800 dark:text-white font-heading">Latest Discoveries</h2>
            <p className="text-surface-500 font-bold uppercase tracking-wider text-xs mt-2">Fresh thoughts from our community</p>
          </div>
          <Link to="/search" className="btn-glassium-secondary py-2 px-6 text-xs">
            View All
          </Link>
        </div>
        {loading ? <Loading /> : (
          latest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {latest.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-20 glassium-card glint-border">
              <p className="text-surface-400 font-bold text-xl">No stories have been told yet.</p>
              <Link to="/create" className="inline-block mt-8 btn-glassium-primary">
                Write the First Story
              </Link>
            </div>
          )
        )}
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glassium-card glint-border p-10 sm:p-20 text-center overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-surface-800 dark:text-white mb-4 font-heading leading-tight">Elevate Your Inbox</h2>
            <p className="text-surface-500 dark:text-surface-400 font-bold mb-12 max-w-md mx-auto">Weekly insights and stories, delivered with glass-like clarity.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                className="flex-1 px-6 py-4 rounded-2xl glassium glint-border focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-800 dark:text-white font-bold" />
              <button type="submit" disabled={subscribing} className="btn-glassium-primary py-4 px-10">
                {subscribing ? 'Joining...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
