import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineEye, HiOutlineHeart, HiOutlineDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getBlogs, deleteBlog } from '../services/api';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">Manage your content</p>
          </div>
          <Link to="/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm">
            <HiOutlinePlus className="w-4 h-4" /> New Blog
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: HiOutlineDocumentText, label: 'Total Posts', value: blogs.length, color: 'primary' },
            { icon: HiOutlineEye, label: 'Total Views', value: totalViews, color: 'accent' },
            { icon: HiOutlineHeart, label: 'Total Likes', value: totalLikes, color: 'primary' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color === 'accent' ? 'bg-accent-500/10 text-accent-500' : 'bg-primary-500/10 text-primary-500'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'published', 'draft'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'glass-card text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Blog list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl">
              <p className="text-surface-400 text-lg mb-4">No blogs yet</p>
              <Link to="/create" className="text-primary-500 font-medium hover:underline">Write your first blog →</Link>
            </div>
          ) : filtered.map((blog, i) => (
            <motion.div key={blog.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                {blog.cover_image ? <img src={blog.cover_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-bg opacity-30" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/blog/${blog.slug}`} className="font-semibold text-surface-900 dark:text-white hover:text-primary-500 transition-colors line-clamp-1">{blog.title}</Link>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${blog.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'}`}>
                    {blog.status}
                  </span>
                  <span className="text-xs text-surface-400">{blog.created_at ? format(new Date(blog.created_at), 'MMM d, yyyy') : ''}</span>
                  <span className="text-xs text-surface-400">{blog.views} views</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link to={`/create?edit=${blog.id}`} className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
                  <HiOutlinePencil className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(blog.id)} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
