import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineGlobe } from 'react-icons/hi';
import BlogCard from '../components/blog/BlogCard';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import { Canvas } from '@react-three/fiber';
import FloatingLogo from '../components/3d/FloatingLogo';
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
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* 3D Scene Overlay */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
            <FloatingLogo />
          </Canvas>
        </div>

        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-950/20 to-white dark:to-surface-950 pointer-events-none" />

        {/* Floating shapes */}
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-[10%] w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-20 right-[10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
              className="text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-400 text-sm font-semibold mb-8 uppercase tracking-widest">
                <HiOutlineSparkles className="w-4 h-4" /> Discover the Future
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] mb-8 drop-shadow-2xl">
                STORY<br />
                <span className="text-blue-500">TELLING</span><br />
                EVOLVED
              </h1>
              <p className="text-xl text-white/60 leading-relaxed mb-10 max-w-md">
                Experience the next generation of blogging. AI-enhanced, 3D immersive, and purely beautiful.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/create"
                  className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Start Writing <HiOutlineArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/search"
                  className="w-full sm:w-auto px-10 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center">
                  Explore
                </Link>
              </div>
            </motion.div>

            {/* Right 3D Scene */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}
              className="relative hidden lg:block h-[500px]">
              <div className="absolute inset-0 z-10">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} />
                  <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                  <FloatingLogo />
                </Canvas>
              </div>
              {/* Decorative status card */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-10 right-0 z-20 glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-tighter">1,240 Readers Online</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Blog (TREK Style) ────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Featured <span className="text-blue-500">Stories</span></h2>
            <div className="w-20 h-1.5 bg-blue-600 mt-2" />
          </div>
          
          <Link to={`/blog/${featured[0].slug}`} className="group block mb-12">
            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden glass border border-white/10">
              <img src={featured[0].cover_image} alt={featured[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 sm:p-12 max-w-3xl">
                <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                  {featured[0].category || 'Featured'}
                </span>
                <h3 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight group-hover:text-blue-400 transition-colors">
                  {featured[0].title}
                </h3>
                <div className="flex items-center gap-4 text-white/60 font-medium">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {featured[0].author?.username?.[0].toUpperCase()}
                  </div>
                  <span>{featured[0].author?.full_name || featured[0].author?.username}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span>{featured[0].read_time} min read</span>
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.slice(1).map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
          </div>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Browse Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <Link key={cat.name} to={`/search?category=${cat.name}`}
                className="px-5 py-2.5 rounded-2xl text-sm font-medium glass-card text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                {cat.name} <span className="text-surface-400 dark:text-surface-500 ml-1">({cat.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Blogs ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Latest Articles</h2>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">Fresh content from our writers</p>
          </div>
          <Link to="/search" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            View All <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? <Loading /> : (
          latest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-surface-400 dark:text-surface-500 text-lg">No blogs yet. Be the first to write!</p>
              <Link to="/create" className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                Write a Blog
              </Link>
            </div>
          )
        )}
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl gradient-bg p-10 sm:p-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-3">Stay in the Loop</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">Get the latest articles and insights delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm" />
              <button type="submit" disabled={subscribing} className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
