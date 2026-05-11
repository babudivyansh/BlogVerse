import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTwitter, FaGithub, FaLinkedin, FaGlobe } from 'react-icons/fa';
import { HiOutlinePencil } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getUserProfile, getUserBlogs, updateProfile } from '../services/api';
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
  const [form, setForm] = useState({ full_name: '', bio: '', social_links: {} });

  const isOwner = me?.username === username;

  useEffect(() => {
    async function load() {
      try {
        const [pRes, bRes] = await Promise.all([getUserProfile(username), getUserBlogs(username)]);
        setProfile(pRes.data);
        setBlogs(bRes.data);
        setForm({ full_name: pRes.data.full_name || '', bio: pRes.data.bio || '', social_links: pRes.data.social_links || {} });
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

  const socialIcons = { twitter: FaTwitter, github: FaGithub, linkedin: FaLinkedin, website: FaGlobe };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile card */}
        <div className="glass-card rounded-3xl p-8 mb-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-5" />
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-primary-500/20">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : profile.username?.[0]?.toUpperCase()}
            </div>

            {editing ? (
              <div className="max-w-sm mx-auto space-y-3">
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name"
                  className="w-full px-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-center text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Bio"
                  className="w-full px-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-center text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none h-20" />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">Save</button>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-600 dark:text-surface-300">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{profile.full_name || profile.username}</h1>
                <p className="text-surface-500 dark:text-surface-400 text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-surface-600 dark:text-surface-300 mt-3 max-w-md mx-auto">{profile.bio}</p>}

                {/* Social links */}
                {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                  <div className="flex justify-center gap-3 mt-4">
                    {Object.entries(profile.social_links).map(([key, url]) => {
                      if (!url) return null;
                      const Icon = socialIcons[key] || FaGlobe;
                      return <a key={key} href={url} target="_blank" rel="noreferrer"
                        className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-500 transition-colors"><Icon className="w-4 h-4" /></a>;
                    })}
                  </div>
                )}

                {isOwner && (
                  <button onClick={() => setEditing(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-colors">
                    <HiOutlinePencil className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </>
            )}

            <p className="text-sm text-surface-400 mt-3">{blogs.length} published blog{blogs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Blogs */}
        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Published Blogs</h2>
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
          </div>
        ) : (
          <p className="text-center text-surface-400 py-16">No published blogs yet.</p>
        )}
      </div>
    </motion.div>
  );
}
