import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { HiOutlineHeart, HiHeart, HiOutlineShare, HiOutlineClock, HiOutlineEye } from 'react-icons/hi';
import { FaTwitter, FaFacebook, FaLinkedin, FaLink } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getBlog, toggleLike, getComments, createComment, getBlogs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import BlogCard from '../components/blog/BlogCard';

export default function BlogPost() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getBlog(slug);
        setBlog(res.data);
        setLiked(res.data.is_liked);
        setLikesCount(res.data.likes_count);
        const cRes = await getComments(res.data.id);
        setComments(cRes.data);
        if (res.data.category) {
          const rRes = await getBlogs({ category: res.data.category, limit: 3 });
          setRelated(rRes.data.items.filter(b => b.id !== res.data.id).slice(0, 3));
        }
      } catch { toast.error('Blog not found'); }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleLike = async () => {
    if (!user) return toast.error('Login to like');
    try {
      const res = await toggleLike(blog.id);
      setLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch { toast.error('Failed to like'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await createComment(blog.id, { content: commentText });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) return <Loading />;
  if (!blog) return <div className="min-h-screen flex items-center justify-center"><p className="text-surface-500">Blog not found</p></div>;

  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(blog.title);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-20">
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Image */}
          {blog.cover_image && (
            <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
              <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
            </div>
          )}

          <div className="p-6 sm:p-10 lg:p-12">
            {/* Meta */}
            <div className="mb-10 text-center">
              {blog.category && (
                <Link to={`/search?category=${blog.category}`}
                  className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 rounded-full mb-6">
                  {blog.category}
                </Link>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-surface-900 dark:text-white leading-[1.1] mb-8">{blog.title}</h1>

              <div className="flex items-center justify-center flex-wrap gap-6 text-sm">
                <Link to={`/profile/${blog.author?.username}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold ring-4 ring-white dark:ring-surface-900 shadow-lg">
                    {blog.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-surface-900 dark:text-white group-hover:text-primary-500 transition-colors">{blog.author?.full_name || blog.author?.username}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{blog.created_at ? format(new Date(blog.created_at), 'MMMM d, yyyy') : ''}</p>
                  </div>
                </Link>
                <div className="h-8 w-[1px] bg-surface-200 dark:bg-surface-800 hidden sm:block"></div>
                <div className="flex items-center gap-6 text-surface-500 dark:text-surface-400 font-medium">
                  <span className="flex items-center gap-2"><HiOutlineClock className="w-5 h-5 text-primary-500" /> {blog.read_time} min read</span>
                  <span className="flex items-center gap-2"><HiOutlineEye className="w-5 h-5 text-primary-500" /> {blog.views} views</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-800 to-transparent mb-12"></div>

            {/* Content */}
            <div className="prose-blog text-surface-700 dark:text-surface-200 mb-16 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                        customStyle={{ borderRadius: '16px', padding: '1.5rem', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)' }} {...props}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-primary-500/10 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props}>{children}</code>
                    );
                  }
                }}>
                {blog.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-12">
                {blog.tags.map(tag => (
                  <Link key={tag.id} to={`/search?tag=${tag.name}`}
                    className="px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 rounded-2xl hover:scale-105 transition-all">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between py-8 border-t border-surface-200 dark:border-surface-800">
              <button onClick={handleLike} className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95">
                {liked ? <HiHeart className="w-7 h-7 text-red-500" /> : <HiOutlineHeart className="w-7 h-7 text-surface-400 dark:text-surface-500" />}
                <span className="text-lg font-bold text-surface-700 dark:text-surface-200">{likesCount}</span>
              </button>
              <div className="relative">
                <button onClick={() => setShareOpen(!shareOpen)} className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-surface-100 dark:hover:bg-white/5 transition-all active:scale-95">
                  <HiOutlineShare className="w-6 h-6 text-surface-500" />
                  <span className="text-lg font-bold text-surface-700 dark:text-surface-200">Share</span>
                </button>
                {shareOpen && (
                  <div className="absolute right-0 bottom-full mb-4 flex gap-3 p-4 glass-card rounded-3xl shadow-2xl animate-fade-in">
                    <a href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`} target="_blank" rel="noreferrer"
                      className="p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"><FaTwitter className="w-5 h-5" /></a>
                    <a href={`https://facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer"
                      className="p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"><FaFacebook className="w-5 h-5" /></a>
                    <a href={`https://linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer"
                      className="p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-700 transition-colors"><FaLinkedin className="w-5 h-5" /></a>
                    <button onClick={copyLink}
                      className="p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-500 transition-colors"><FaLink className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <section className="mt-16 mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-surface-900 dark:text-white">Community Comments</h3>
            <span className="px-3 py-1 bg-surface-200 dark:bg-surface-800 rounded-full text-sm font-bold text-surface-600 dark:text-surface-400">{comments.length}</span>
          </div>
          
          {user && (
            <form onSubmit={handleComment} className="mb-12">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Join the conversation..."
                className="w-full p-6 rounded-3xl bg-white/50 dark:bg-surface-900/50 backdrop-blur-xl border-2 border-surface-200 dark:border-surface-800 focus:border-primary-500 transition-all text-surface-900 dark:text-white resize-none min-h-[120px] shadow-sm" />
              <div className="flex justify-end mt-4">
                <button type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  Post Comment
                </button>
              </div>
            </form>
          )}
          
          <div className="space-y-6">
            {comments.map(c => (
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                key={c.id} className="p-6 rounded-3xl glass-card flex gap-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {c.author?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-surface-900 dark:text-white">{c.author?.username}</span>
                    <span className="text-xs font-medium text-surface-400">{c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : ''}</span>
                  </div>
                  <p className="text-surface-600 dark:text-surface-300 leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-16 glass-card rounded-3xl border-dashed border-2 border-surface-200 dark:border-surface-800">
                <p className="text-surface-400 font-medium">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-surface-900 dark:text-white">More from BlogVerse</h3>
              <Link to="/search" className="text-sm font-bold text-primary-500 hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((b, i) => <BlogCard key={b.id} blog={b} index={i} />)}
            </div>
          </section>
        )}
      </article>
    </motion.div>
  );
}
