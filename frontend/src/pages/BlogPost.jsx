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
      {/* Immersive Cover Section */}
      <section className="relative h-[60vh] sm:h-[80vh] w-full overflow-hidden">
        {blog.cover_image ? (
          <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-bg opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-4">
          <div className="max-w-4xl w-full">
            {blog.category && (
              <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                {blog.category}
              </span>
            )}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-8 drop-shadow-2xl">
              {blog.title}
            </h1>
            <div className="flex items-center gap-6 text-white/80 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {blog.author?.username?.[0].toUpperCase()}
                </div>
                <span>{blog.author?.full_name || blog.author?.username}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span>{blog.created_at ? format(new Date(blog.created_at), 'MMMM d, yyyy') : ''}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:block" />
              <span className="hidden sm:block">{blog.read_time} min read</span>
            </div>
          </div>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Meta Bar */}
        <div className="flex items-center justify-between py-8 border-b border-white/10 mb-12">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className="flex items-center gap-2 group">
              <div className={`p-3 rounded-full transition-all ${liked ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10'}`}>
                {liked ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}
              </div>
              <span className="text-lg font-bold text-white">{likesCount}</span>
            </button>
            <div className="flex items-center gap-2 text-white/40">
              <HiOutlineEye className="w-6 h-6" />
              <span className="text-lg font-bold">{blog.views}</span>
            </div>
          </div>
          
          <div className="relative">
            <button onClick={() => setShareOpen(!shareOpen)} className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
              <HiOutlineShare className="w-5 h-5" /> Share
            </button>
            <AnimatePresence>
              {shareOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 bottom-full mb-4 flex gap-3 p-4 glass rounded-3xl shadow-2xl border border-white/10">
                  <a href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`} target="_blank" rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><FaTwitter /></a>
                  <a href={`https://facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><FaFacebook /></a>
                  <a href={`https://linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-700/10 text-blue-600 hover:bg-blue-700 hover:text-white transition-all"><FaLinkedin /></a>
                  <button onClick={copyLink}
                    className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all"><FaLink /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="prose-blog text-surface-700 dark:text-surface-300 mb-12">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                    customStyle={{ borderRadius: '12px', fontSize: '14px' }} {...props}>
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              }
            }}>
            {blog.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map(tag => (
              <Link key={tag.id} to={`/search?tag=${tag.name}`}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between py-6 border-y border-surface-200 dark:border-surface-800 mb-12">
          <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            {liked ? <HiHeart className="w-6 h-6 text-red-500" /> : <HiOutlineHeart className="w-6 h-6 text-surface-400" />}
            <span className="text-sm font-medium text-surface-600 dark:text-surface-300">{likesCount}</span>
          </button>
          <div className="relative">
            <button onClick={() => setShareOpen(!shareOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
              <HiOutlineShare className="w-5 h-5 text-surface-500" />
              <span className="text-sm font-medium text-surface-600 dark:text-surface-300">Share</span>
            </button>
            {shareOpen && (
              <div className="absolute right-0 bottom-full mb-2 flex gap-2 p-3 glass-card rounded-2xl shadow-lg">
                <a href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`} target="_blank" rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"><FaTwitter /></a>
                <a href={`https://facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"><FaFacebook /></a>
                <a href={`https://linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-700 transition-colors"><FaLinkedin /></a>
                <button onClick={copyLink}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-white/5 text-surface-500 transition-colors"><FaLink /></button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Comments ({comments.length})</h3>
          {user && (
            <form onSubmit={handleComment} className="mb-8">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white resize-none min-h-[100px]" />
              <button type="submit"
                className="mt-3 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm">
                Post Comment
              </button>
            </form>
          )}
          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="p-4 rounded-2xl glass-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-semibold">
                    {c.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">{c.author?.username}</span>
                  <span className="text-xs text-surface-400">{c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : ''}</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300 pl-9">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-surface-400 py-8">No comments yet. Be the first!</p>}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Related Posts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((b, i) => <BlogCard key={b.id} blog={b} index={i} />)}
            </div>
          </section>
        )}
      </article>
    </motion.div>
  );
}
