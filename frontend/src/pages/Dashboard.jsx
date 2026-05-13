import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineEye, HiOutlineHeart, HiOutlineDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getBlogs, deleteBlog, formatImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadBlogs();
  }, [user]);

  const loadBlogs = async () => {
    try {
      const res = await getBlogs({ author: user.username, limit: 50 });
      setBlogs(res.data.items);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await deleteBlog(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      toast.success('Blog deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = filter === 'all' ? blogs : blogs.filter(b => b.status === filter);
  const totalViews = blogs.reduce((s, b) => s + b.views, 0);
  const totalLikes = blogs.reduce((s, b) => s + (b.likes_count || 0), 0);

  if (loading) return <Loading />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Your Atelier</h1>
            <p className="text-surface-500 font-bold uppercase tracking-widest text-xs mt-2">Manage your high-end content</p>
          </div>
          <Link to="/create" className="btn-glassium-primary py-3 px-8 text-sm">
            <HiOutlinePlus className="w-5 h-5 mr-2 inline" /> New Creation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: HiOutlineDocumentText, label: 'Stories Told', value: blogs.length, color: 'primary' },
            { icon: HiOutlineEye, label: 'Total Resonance', value: totalViews, color: 'accent' },
            { icon: HiOutlineHeart, label: 'Community Love', value: totalLikes, color: 'primary' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glassium-card glint-border p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-6 shadow-sm">
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-4xl font-black text-surface-800 dark:text-white mb-1 font-heading">{stat.value}</p>
              <p className="text-xs font-black text-surface-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-10">
          {['all', 'published', 'draft'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 text-surface-500'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Blog list */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-24 glassium-card glint-border border-dashed border-2">
              <p className="text-surface-400 font-black text-2xl mb-6">Your canvas is empty.</p>
              <Link to="/create" className="btn-glassium-secondary">Begin a New Journey</Link>
            </div>
          ) : filtered.map((blog, i) => (
            <motion.div key={blog.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glassium-card glint-border p-5 flex items-center gap-6 group hover:scale-[1.01] transition-all">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-100 dark:bg-white/5 shrink-0 shadow-inner">
                {blog.cover_image ? <img src={formatImageUrl(blog.cover_image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-20" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/blog/${blog.slug}`} className="text-lg font-black text-surface-800 dark:text-white hover:text-primary-500 transition-colors line-clamp-1 font-heading mb-2">{blog.title}</Link>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${blog.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {blog.status}
                  </span>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{blog.created_at ? format(new Date(blog.created_at), 'MMM d, yyyy') : ''}</span>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1"><HiOutlineEye className="w-3 h-3" /> {blog.views}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/create?edit=${blog.id}`} className="p-4 rounded-2xl glassium text-surface-400 hover:text-primary-500 hover:scale-110 transition-all shadow-sm">
                  <HiOutlinePencil className="w-5 h-5" />
                </Link>
                <button onClick={() => handleDelete(blog.id)} className="p-4 rounded-2xl glassium text-surface-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm">
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
