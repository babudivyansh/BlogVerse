import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInstagram, FaFacebook, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { HiOutlinePencil, HiOutlineLocationMarker, HiOutlineUserCircle, HiOutlineBriefcase, HiOutlineLink, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getUserProfile, getUserBlogs, updateProfile, formatImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BlogCard from '../components/blog/BlogCard';
import Loading from '../components/common/Loading';

export default function Profile() {
  const { username } = useParams();
  const { user: me, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    full_name: '', 
    headline: '', 
    location: '', 
    bio: '', 
    avatar_url: '', 
    social_links: {} 
  });

  const isOwner = me?.username === username;

  useEffect(() => {
    async function load() {
      try {
        const [pRes, bRes] = await Promise.all([getUserProfile(username), getUserBlogs(username)]);
        const p = pRes.data;
        setProfile(p);
        setBlogs(bRes.data);
        setForm({ 
          full_name: p.full_name || '', 
          headline: p.headline || '', 
          location: p.location || '', 
          bio: p.bio || '', 
          avatar_url: p.avatar_url || '', 
          social_links: p.social_links || {} 
        });
      } catch { toast.error('User not found'); }
      setLoading(false);
    }
    load();
  }, [username]);

  const handleSave = async () => {
    try {
      await updateProfile(form);
      await refreshUser();
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <Loading />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center"><p className="text-surface-500">User not found</p></div>;

  const socialIcons = { 
    instagram: FaInstagram,
    twitter: FaXTwitter,
    facebook: FaFacebook,
    threads: FaThreads,
    github: FaGithub, 
    linkedin: FaLinkedin, 
    website: FaGlobe 
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile card */}
        <div className="glassium-card glint-border rounded-[2.5rem] p-10 mb-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-8 relative group overflow-hidden mx-auto">
              {profile.avatar_url ? (
                <img 
                  src={formatImageUrl(profile.avatar_url)} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = profile.username?.[0]?.toUpperCase();
                  }}
                />
              ) : (
                profile.username?.[0]?.toUpperCase()
              )}
            </div>

            <h1 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-2">
              {profile.full_name || profile.username}
            </h1>
            
            {profile.headline && (
              <p className="text-lg font-bold text-primary-500 mb-4 uppercase tracking-[0.2em] text-[10px]">
                {profile.headline}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 text-sm font-bold text-surface-500 dark:text-surface-400 mb-6">
              <span className="flex items-center gap-2">@{profile.username}</span>
              {profile.location && (
                <span className="flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" /> {profile.location}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed text-lg font-medium">
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            {profile.social_links && Object.values(profile.social_links).some(v => v) && (
              <div className="flex justify-center gap-4 mb-8">
                {Object.entries(profile.social_links).map(([key, url]) => {
                  if (!url) return null;
                  const Icon = socialIcons[key] || FaGlobe;
                  return (
                    <a key={key} href={url} target="_blank" rel="noreferrer"
                      className="w-12 h-12 rounded-2xl glassium glint-border flex items-center justify-center text-surface-500 hover:text-primary-500 hover:scale-110 transition-all shadow-sm group">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                  );
                })}
              </div>
            )}

            <div className="mt-12 flex flex-col items-center gap-10">
              {isOwner && (
                <button onClick={() => setEditing(true)}
                  className="btn-glassium-secondary py-4 px-10 text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-primary-500/20">
                  <HiOutlinePencil className="w-4 h-4 mr-2" /> Customize Profile
                </button>
              )}

              <div className="flex items-center gap-16 py-6 px-12 glassium glint-border rounded-3xl">
                <div className="text-center">
                  <p className="text-3xl font-black text-surface-800 dark:text-white leading-none">{blogs.length}</p>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-2">Stories</p>
                </div>
                <div className="w-px h-8 bg-surface-200 dark:bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-black text-surface-800 dark:text-white leading-none">
                    {blogs.reduce((s, b) => s + b.views, 0)}
                  </p>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-2">Resonance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blogs */}
        <h2 className="text-3xl font-black text-surface-800 dark:text-white mb-10 font-heading tracking-tight">The Collected Works</h2>
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-32 glassium-card glint-border border-dashed border-2 rounded-[2.5rem]">
            <p className="text-surface-400 font-black text-xl">The archives are currently empty.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pt-28 pb-12 px-4 md:px-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setEditing(false)}
              className="absolute inset-0 bg-surface-950/60 backdrop-blur-xl" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glassium-card glint-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 max-h-[82vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Refine Your Identity</h2>
                  <button onClick={() => setEditing(false)} className="p-2 rounded-xl glassium hover:bg-red-500/10 hover:text-red-500 transition-all">
                    <HiOutlineX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <HiOutlineUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} 
                          placeholder="Your Name" className="w-full pl-12 pr-4 py-3.5 rounded-xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1">Headline</label>
                      <div className="relative">
                        <HiOutlineBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} 
                          placeholder="e.g. Design Alchemist" className="w-full pl-12 pr-4 py-3.5 rounded-xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1">Location</label>
                      <div className="relative">
                        <HiOutlineLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} 
                          placeholder="e.g. London, UK" className="w-full pl-12 pr-4 py-3.5 rounded-xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1">Avatar URL</label>
                      <div className="relative">
                        <HiOutlineLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <input value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} 
                          placeholder="Link to profile picture" className="w-full pl-12 pr-4 py-3.5 rounded-xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1">Bio</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} 
                      placeholder="Tell your story..." className="w-full p-5 rounded-2xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-bold resize-none h-24 text-sm" />
                  </div>

                  {/* Social links */}
                  <div className="pt-4">
                    <label className="text-xs font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest ml-1 block mb-4">Digital Footprint</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'instagram', Icon: FaInstagram, color: 'text-[#E4405F]' },
                        { key: 'twitter', Icon: FaXTwitter, color: 'text-surface-800 dark:text-white' },
                        { key: 'facebook', Icon: FaFacebook, color: 'text-[#1877F2]' },
                        { key: 'threads', Icon: FaThreads, color: 'text-surface-800 dark:text-white' },
                      ].map(s => (
                        <div key={s.key} className="relative">
                          <s.Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${s.color} opacity-100`} />
                          <input value={form.social_links[s.key] || ''} 
                            onChange={e => setForm({ ...form, social_links: { ...form.social_links, [s.key]: e.target.value } })}
                            placeholder={`${s.key.charAt(0).toUpperCase() + s.key.slice(1)} URL`}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl glassium border-none outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-xs font-bold" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button onClick={handleSave} className="flex-1 btn-glassium-primary py-4 text-sm uppercase tracking-widest">
                      Preserve Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="flex-1 btn-glassium-secondary py-4 text-sm uppercase tracking-widest">
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
