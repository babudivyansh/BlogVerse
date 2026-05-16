import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { HiOutlineArrowRight, HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineGlobe } from 'react-icons/hi';
import BlogCard from '../components/blog/BlogCard';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import SEO from '../components/common/SEO';
import { getBlogs, getFeaturedBlogs, getCategories, getStories, getStory, formatImageUrl } from '../services/api';
import NewsletterSection from '../components/common/NewsletterSection';
import WebStoryViewer from '../components/stories/WebStoryViewer';
import { AnimatePresence } from 'framer-motion';
import { IoPlayCircle } from 'react-icons/io5';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [featRes, latestRes, catRes, storiesRes] = await Promise.allSettled([
          getFeaturedBlogs(),
          getBlogs({ page: 1, limit: 9 }),
          getCategories(),
          getStories({ limit: 10 })
        ]);
        if (featRes.status === 'fulfilled') setFeatured(featRes.value.data || []);
        if (latestRes.status === 'fulfilled') setLatest(latestRes.value.data?.items || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data || []);
        if (storiesRes.status === 'fulfilled') setStories(storiesRes.value.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const handleOpenStory = async (story) => {
    try {
      const { data } = await getStory(story.slug);
      setActiveStory(data);
    } catch {
      toast.error('Failed to load story details');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <SEO 
        title="AI-Powered Blog Platform" 
        description="Explore BlogVerse for the latest technology trends, innovations, and digital advancements."
      />
      
      {/* Web Story Viewer Portal */}
      <AnimatePresence>
        {activeStory && (
          <WebStoryViewer 
            story={activeStory} 
            onClose={() => setActiveStory(null)} 
          />
        )}
      </AnimatePresence>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative px-8 sm:px-12 lg:px-20 mb-32">
        <div className="max-w-[1600px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassium glint-border text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest mb-10">
              <HiOutlineSparkles className="w-4 h-4 animate-pulse" /> The Future of Digital Expression
            </div>
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black text-surface-800 dark:text-white leading-[0.9] tracking-tight mb-8 font-heading">
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
                View All Blogs
              </Link>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 max-w-7xl mx-auto">
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
        <section className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-20 py-20 border-b border-surface-100 dark:border-white/5">
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
        <section className="max-w-[1300px] mx-auto px-8 sm:px-12 lg:px-20 py-24 bg-surface-50 dark:bg-white/2 rounded-[3rem] my-20">
          <div className="relative">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Explore by Category</h2>
                <p className="text-surface-500 font-bold uppercase tracking-widest text-xs mt-3">Dive deep into specific insights</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/search?category=${cat.name}`}
                    className="group relative block p-8 glassium-card glint-border rounded-[2rem] overflow-hidden hover:scale-105 transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500" />
                    <div className="relative z-10 text-center">
                      <h3 className="text-xl font-black text-surface-800 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">{cat.name}</h3>
                      <p className="text-xs font-black text-surface-400 uppercase tracking-widest">{cat.count} Stories</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Visual Tales (Stories) ────────────────────────── */}
      {stories.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-20 py-24 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Visual Tales</h2>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <span className="w-12 h-[2px] bg-primary-500" />
                <p className="text-surface-500 font-bold uppercase tracking-wider text-xs">Immersive narratives in vertical format</p>
              </div>
            </div>
            <Link to="/stories" className="premium-link text-sm font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 uppercase tracking-[0.2em] transition-colors duration-300">
              View All Stories
            </Link>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
            {stories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleOpenStory(story)}
                className="relative flex-shrink-0 w-[240px] md:w-[280px] aspect-[9/16] rounded-[2.5rem] overflow-hidden glassium-card glint-border group cursor-pointer shadow-2xl snap-start"
              >
                <img 
                  src={formatImageUrl(story.cover_image)} 
                  alt={story.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100">
                   <div className="w-16 h-16 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 text-white">
                     <IoPlayCircle size={32} />
                   </div>
                </div>

                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary-400 mb-2">{story.blog_category || 'Tale'}</span>
                  <h3 className="text-lg font-black text-white leading-tight font-heading group-hover:text-primary-400 transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Blogs ─────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-20 py-24">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Latest Discoveries</h2>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <span className="w-12 h-[2px] bg-primary-500" />
              <p className="text-surface-500 font-bold uppercase tracking-wider text-xs">Fresh thoughts from our community</p>
            </div>
          </div>
          <Link to="/search" className="premium-link text-sm font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 uppercase tracking-[0.2em] transition-colors duration-300">
            View All Blogs
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
      <NewsletterSection />
    </div>
  );
}
