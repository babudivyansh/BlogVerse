import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineEye, HiOutlineHeart, HiOutlineTrash, HiOutlineStar, HiOutlineBan } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getAdminStats, getAdminUsers, getAdminBlogs, deleteUser, adminDeleteBlog, toggleFeatured, toggleBlockUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [sRes, uRes, bRes] = await Promise.all([getAdminStats(), getAdminUsers(), getAdminBlogs()]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setBlogs(bRes.data);
    } catch { toast.error('Failed to load admin data'); }
    setLoading(false);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed'); }
  };

  const handleBlockUser = async (id) => {
    try {
      const res = await toggleBlockUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: res.data.is_blocked } : u));
      toast.success(res.data.is_blocked ? 'User blocked' : 'User unblocked');
    } catch { toast.error('Failed to toggle block status'); }
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await adminDeleteBlog(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      toast.success('Blog deleted');
    } catch { toast.error('Failed'); }
  };

  const handleFeature = async (id) => {
    try {
      const res = await toggleFeatured(id);
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, is_featured: res.data.is_featured } : b));
      toast.success(res.data.is_featured ? 'Featured!' : 'Unfeatured');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Loading />;

  const statCards = [
    { icon: HiOutlineUsers, label: 'Total Users', value: stats?.total_users || 0, color: 'bg-blue-500/10 text-blue-500' },
    { icon: HiOutlineDocumentText, label: 'Total Blogs', value: stats?.total_blogs || 0, color: 'bg-primary-500/10 text-primary-500' },
    { icon: HiOutlineEye, label: 'Total Views', value: stats?.total_views || 0, color: 'bg-accent-500/10 text-accent-500' },
    { icon: HiOutlineHeart, label: 'Total Likes', value: stats?.total_likes || 0, color: 'bg-red-500/10 text-red-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Admin Panel</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mb-8">Manage your platform</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'users', 'blogs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-primary-500 text-white' : 'glass-card text-surface-600 dark:text-surface-300'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Table */}
        {tab === 'users' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-semibold">{u.username?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white">{u.username}</p>
                            {u.is_admin && <span className="text-xs text-primary-500 font-medium">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${u.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'}`}>
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                        {u.is_blocked && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-md bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : ''}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {!u.is_admin && (
                            <>
                              <button onClick={() => handleBlockUser(u.id)} className={`p-1.5 rounded-lg transition-colors ${u.is_blocked ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-surface-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                                <HiOutlineBan className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blogs Table */}
        {tab === 'blogs' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Views</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {blogs.map(b => (
                    <tr key={b.id} className="hover:bg-surface-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-surface-900 dark:text-white max-w-xs truncate">{b.title}</td>
                      <td className="px-4 py-3 text-sm text-surface-500">{b.author?.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${b.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{b.views}</td>
                      <td className="px-4 py-3 text-right flex gap-1 justify-end">
                        <button onClick={() => handleFeature(b.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors">
                          <HiOutlineStar className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteBlog(b.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Platform Overview</h3>
            <p className="text-surface-500 dark:text-surface-400">
              {stats?.published_blogs || 0} published blogs · {stats?.total_comments || 0} comments · {stats?.total_users || 0} users
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
