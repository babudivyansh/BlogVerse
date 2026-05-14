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
import { FaInstagram, FaFacebook, FaLinkedin, FaLink, FaGithub, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { getBlog, toggleLike, getComments, createComment, getBlogs, formatImageUrl } from '../services/api';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-20">
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glassium-card glint-border overflow-hidden shadow-2xl">
          {/* Header Image */}
          {blog.cover_image && (
            <div className="w-full h-[300px] sm:h-[450px] lg:h-[600px] overflow-hidden">
              <img src={formatImageUrl(blog.cover_image)} alt={blog.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[2s] ease-out" />
            </div>
          )}

          <div className="p-8 sm:p-12 lg:p-20">
            {/* Meta */}
            <div className="mb-12 text-center">
              {blog.category && (
                <Link to={`/search?category=${blog.category}`}
                  className="inline-block px-5 py-2 text-[10px] font-black tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400 glassium rounded-full mb-8">
                  {blog.category}
                </Link>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-surface-800 dark:text-white leading-[1] mb-10 font-heading tracking-tight">{blog.title}</h1>

              <div className="flex items-center justify-center flex-wrap gap-8 text-sm">
                <Link to={`/profile/${blog.author?.username}`} className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black shadow-xl group-hover:scale-110 transition-transform">
                    {blog.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-surface-800 dark:text-white text-lg leading-none mb-1">{blog.author?.full_name || blog.author?.username}</p>
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2">{blog.created_at ? format(new Date(blog.created_at), 'MMMM d, yyyy') : ''}</p>
                    
                    {/* Author Socials */}
                    {blog.author?.social_links && (
                      <div className="flex gap-2">
                        {Object.entries(blog.author.social_links).map(([key, url]) => {
                          if (!url) return null;
                          const icons = { instagram: FaInstagram, twitter: FaXTwitter, facebook: FaFacebook, threads: FaThreads, github: FaGithub, linkedin: FaLinkedin, website: FaGlobe };
                          const Icon = icons[key] || FaGlobe;
                          return (
                            <a key={key} href={url} target="_blank" rel="noreferrer" 
                              className="text-surface-400 hover:text-primary-500 transition-colors">
                              <Icon className="w-3.5 h-3.5" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="h-10 w-[1px] bg-surface-200 dark:bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-8 text-surface-500 font-bold uppercase tracking-widest text-[10px]">
                  <span className="flex items-center gap-2"><HiOutlineClock className="w-5 h-5 text-primary-500" /> {blog.read_time} min read</span>
                  <span className="flex items-center gap-2"><HiOutlineEye className="w-5 h-5 text-primary-500" /> {blog.views} views</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-surface-100 dark:via-white/5 to-transparent mb-16"></div>

            {/* Content */}
            <div className="prose-glassium max-w-none mb-20">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                        customStyle={{ borderRadius: '24px', padding: '2rem', fontSize: '15px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.9)' }} {...props}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="glassium text-primary-600 dark:text-primary-400 px-2 py-1 rounded-lg font-black text-sm" {...props}>{children}</code>
                    );
                  }
                }}>
                {blog.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-16">
                {blog.tags.map(tag => (
                  <Link key={tag.id} to={`/search?tag=${tag.name}`}
                    className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 glassium rounded-[1.25rem] hover:bg-primary-500 hover:text-white transition-all transform hover:-translate-y-1">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between py-10 border-t border-surface-100 dark:border-white/5">
              <button onClick={handleLike} className="flex items-center gap-4 px-8 py-4 rounded-[1.5rem] glassium hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 group">
                {liked ? <HiHeart className="w-8 h-8 text-red-500" /> : <HiOutlineHeart className="w-8 h-8 text-surface-400 group-hover:text-red-400" />}
                <span className="text-xl font-black text-surface-800 dark:text-white">{likesCount}</span>
              </button>
              <div className="relative">
                <button onClick={() => setShareOpen(!shareOpen)} className="flex items-center gap-4 px-8 py-4 rounded-[1.5rem] glassium hover:bg-primary-50 dark:hover:bg-white/5 transition-all active:scale-95">
                  <HiOutlineShare className="w-7 h-7 text-primary-500" />
                  <span className="text-xl font-black text-surface-800 dark:text-white">Share</span>
                </button>
                {shareOpen && (
                  <div className="absolute right-0 bottom-full mb-6 flex gap-4 p-5 glassium-card glint-border shadow-2xl animate-fade-in">
                    <a href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`} target="_blank" rel="noreferrer"
                      className="p-4 rounded-2xl glassium text-surface-900 dark:text-white hover:text-[#000000] dark:hover:text-white hover:scale-110 transition-all"><FaXTwitter className="w-6 h-6" /></a>
                    <a href={`https://facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer"
                      className="p-4 rounded-2xl glassium text-blue-600 hover:scale-110 transition-all"><FaFacebook className="w-6 h-6" /></a>
                    <a href={`https://linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer"
                      className="p-4 rounded-2xl glassium text-blue-700 hover:scale-110 transition-all"><FaLinkedin className="w-6 h-6" /></a>
                    <button onClick={copyLink}
                      className="p-4 rounded-2xl glassium text-surface-500 hover:scale-110 transition-all"><FaLink className="w-6 h-6" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <section className="mt-24 mb-32">
          <div className="flex items-center gap-6 mb-12">
            <h3 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Voices of the Community</h3>
            <span className="px-5 py-2 glassium rounded-full text-sm font-black text-primary-500">{comments.length}</span>
          </div>
          
          {user && (
            <form onSubmit={handleComment} className="mb-16">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full p-8 rounded-[2.5rem] glassium glint-border focus:ring-2 focus:ring-primary-500/30 transition-all text-surface-800 dark:text-white font-bold text-lg resize-none min-h-[160px] shadow-sm" />
              <div className="flex justify-end mt-6">
                <button type="submit" className="btn-glassium-primary text-lg px-12">
                  Post Reflection
                </button>
              </div>
            </form>
          )}
          
          <div className="space-y-8">
            {comments.map(c => (
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                key={c.id} className="p-8 rounded-[2rem] glassium-card glint-border flex gap-6">
                <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-black shadow-lg">
                  {c.author?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-surface-800 dark:text-white text-lg">{c.author?.username}</span>
                    <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">{c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : ''}</span>
                  </div>
                  <p className="text-surface-600 dark:text-surface-300 font-medium leading-relaxed text-lg">{c.content}</p>
                </div>
              </motion.div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-24 glassium-card glint-border border-dashed border-2">
                <p className="text-surface-400 font-black text-xl">The conversation is just beginning.</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mb-32">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-4xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Continue Your Journey</h3>
              <Link to="/search" className="btn-glassium-secondary py-2 px-6 text-xs font-black">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {related.map((b, i) => <BlogCard key={b.id} blog={b} index={i} />)}
            </div>
          </section>
        )}
      </article>
    </motion.div>
  );
}
