import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineMail, HiOutlineArrowRight } from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { getCategories, getTags, subscribeNewsletter, formatImageUrl } from '../../services/api';
import toast from 'react-hot-toast';

export default function BlogSidebar({ author }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, tagRes] = await Promise.allSettled([
          getCategories(),
          getTags()
        ]);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
        if (tagRes.status === 'fulfilled') setTags(tagRes.value.data);
      } catch (err) {
        console.error('Failed to load sidebar data', err);
      }
    }
    loadData();
  }, []);

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
    <aside className="space-y-10 sticky top-32">
      {/* Author Section */}
      {author && (
        <section className="glassium-card glint-border p-8 overflow-hidden relative group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700" />
          
          <h3 className="text-xs font-black text-surface-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-primary-500/30" /> About Author
          </h3>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-400 to-primary-600 p-1 mb-6 shadow-xl hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-[1.85rem] overflow-hidden bg-white dark:bg-surface-900 flex items-center justify-center text-white text-3xl font-black">
                {author.avatar_url ? (
                  <img 
                    src={formatImageUrl(author.avatar_url)} 
                    alt={author.username} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerText = author.username?.[0]?.toUpperCase();
                    }}
                  />
                ) : (
                  author.username?.[0]?.toUpperCase()
                )}
              </div>
            </div>
            
            <Link to={`/profile/${author.username}`} className="text-2xl font-black text-surface-800 dark:text-white hover:text-primary-500 transition-colors font-heading mb-2">
              {author.full_name || author.username}
            </Link>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-8 leading-relaxed line-clamp-3">
              {author.bio || "Passionate writer and digital explorer sharing insights on technology and innovation."}
            </p>

            {/* Social Links */}
            {author.social_links && (
              <div className="flex flex-wrap justify-center gap-3">
                {Object.entries(author.social_links).map(([key, url]) => {
                  if (!url) return null;
                  const icons = { instagram: FaInstagram, twitter: FaXTwitter, facebook: FaFacebook, threads: FaThreads, github: FaGithub, linkedin: FaLinkedin, website: FaGlobe };
                  const Icon = icons[key] || FaGlobe;
                  return (
                    <a key={key} href={url} target="_blank" rel="noreferrer" 
                      className="w-10 h-10 rounded-xl glassium glint-border flex items-center justify-center text-surface-400 hover:text-primary-500 hover:scale-110 transition-all shadow-sm">
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="glassium-card glint-border p-8">
        <h3 className="text-xs font-black text-surface-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary-500/30" /> Explore Categories
        </h3>
        <div className="space-y-3">
          {categories.map((cat) => (
            <Link key={cat.name} to={`/search?category=${cat.name}`}
              className="flex items-center justify-between p-4 rounded-2xl glassium hover:bg-primary-500 hover:text-white transition-all group">
              <span className="text-sm font-bold tracking-tight">{cat.name}</span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                {cat.count}
              </span>
            </Link>
          ))}
          {categories.length === 0 && <p className="text-xs text-surface-400 italic">Finding categories...</p>}
        </div>
      </section>

      {/* Newsletter Widget */}
      <section className="glassium-card glint-border p-8 bg-gradient-to-br from-primary-500/5 to-transparent">
        <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20">
          <HiOutlineMail className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black text-surface-800 dark:text-white font-heading mb-3">Stay Enlightened</h3>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-8 leading-relaxed">
          Join 5,000+ readers getting weekly insights on the future of technology.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-4">
          <input 
            type="email" 
            placeholder="Your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-sm font-bold outline-none"
          />
          <button type="submit" disabled={subscribing} className="w-full btn-glassium-primary py-4 text-xs font-black uppercase tracking-widest">
            {subscribing ? 'Joining...' : 'Subscribe Now'}
          </button>
        </form>
      </section>

      {/* Tags Cloud */}
      <section className="glassium-card glint-border p-8">
        <h3 className="text-xs font-black text-surface-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary-500/30" /> Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 12).map(tag => (
            <Link key={tag.id} to={`/search?tag=${tag.name}`}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 glassium rounded-xl hover:bg-primary-500 hover:text-white transition-all">
              #{tag.name}
            </Link>
          ))}
          {tags.length === 0 && <p className="text-xs text-surface-400 italic">Loading tags...</p>}
        </div>
      </section>

      {/* Featured Suggestion */}
      <section className="relative p-8 rounded-[2.5rem] bg-surface-900 overflow-hidden text-center group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent" />
        <div className="relative z-10">
          <HiOutlineSparkles className="w-10 h-10 text-primary-400 mx-auto mb-6 animate-pulse" />
          <h4 className="text-xl font-black text-white mb-4 font-heading">Have a Story to Tell?</h4>
          <p className="text-sm text-surface-400 mb-8 px-4">Share your unique perspective with our global community of thinkers.</p>
          <Link to="/create" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary-400 hover:text-white transition-colors">
            Start Writing <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </aside>
  );
}
