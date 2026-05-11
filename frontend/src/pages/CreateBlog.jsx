import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { HiOutlineSparkles, HiOutlinePhotograph, HiOutlineTag, HiOutlineLightningBolt } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { createBlog, updateBlog, getBlog, uploadImage, aiGenerateTitle, aiGenerateSummary, aiSuggestTags, aiImproveContent, aiGenerateBlog } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function CreateBlog() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (editId) loadBlog();
  }, [user, editId]);

  const loadBlog = async () => {
    try {
      // Fetch all user blogs and find by ID
      const res = await getBlog(editId);
      const blog = res.data;
      setTitle(blog.title);
      setContent(blog.content);
      setSummary(blog.summary || '');
      setCategory(blog.category || '');
      setTags(blog.tags?.map(t => t.name).join(', ') || '');
      setCoverImage(blog.cover_image || '');
      setStatus(blog.status);
    } catch { toast.error('Failed to load blog'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      setCoverImage(res.data.url);
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); }
  };

  const handleSubmit = async (pub = false) => {
    if (!title.trim() || !content.trim()) return toast.error('Title and content are required');
    setSaving(true);
    const data = {
      title, content, summary, category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image: coverImage,
      status: pub ? 'published' : status,
    };
    try {
      if (editId) {
        await updateBlog(editId, data);
        toast.success('Blog updated!');
      } else {
        await createBlog(data);
        toast.success(pub ? 'Blog published!' : 'Draft saved!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  const handleAI = async (action) => {
    setAiLoading(action);
    try {
      if (action === 'title') {
        const res = await aiGenerateTitle(title || 'blog');
        const titles = res.data.titles;
        if (titles?.length) { setTitle(titles[0]); toast.success('Title generated!'); }
      } else if (action === 'summary') {
        const res = await aiGenerateSummary(content);
        setSummary(res.data.summary);
        toast.success('Summary generated!');
      } else if (action === 'tags') {
        const res = await aiSuggestTags(content);
        setTags(res.data.tags.join(', '));
        toast.success('Tags suggested!');
      } else if (action === 'improve') {
        const res = await aiImproveContent(content);
        setContent(res.data.improved_content);
        toast.success('Content improved!');
      } else if (action === 'full-blog') {
        const blogTopic = title || window.prompt('Enter a topic to generate a full blog post:');
        if (!blogTopic) { setAiLoading(''); return toast.error('Topic is required'); }
        const tone = window.prompt('Enter tone (e.g. professional, casual, funny):', 'professional') || 'professional';
        toast.loading('Generating full blog... this may take a minute!', { id: 'aigen' });
        const res = await aiGenerateBlog({ topic: blogTopic, tone });
        const data = res.data;
        setTitle(data.title);
        setContent(data.content);
        setSummary(data.summary);
        setCategory(data.category);
        setTags(data.tags.join(', '));
        toast.success('Blog generated successfully!', { id: 'aigen' });
      }
    } catch { toast.error('AI feature failed. Check API key or quota.', { id: 'aigen' }); }
    setAiLoading('');
  };

  const categories = ['Technology', 'Design', 'Programming', 'AI & ML', 'Web Dev', 'DevOps', 'Mobile', 'Data Science', 'Career', 'Other'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main editor */}
          <div className="flex-1">
            <div className="glass-card rounded-2xl p-6 mb-4">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Blog title..."
                className="w-full text-3xl font-bold bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-600 mb-4" />

              {/* Cover image */}
              <div className="mb-4">
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden mb-2">
                    <img src={coverImage} alt="Cover" className="w-full h-48 object-cover" />
                    <button onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg text-xs">Remove</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePhotograph className="w-5 h-5 text-surface-400" />
                    <span className="text-sm text-surface-500">Add cover image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Markdown editor */}
              <div data-color-mode={dark ? 'dark' : 'light'}>
                <MDEditor value={content} onChange={setContent} height={500}
                  preview="live" hideToolbar={false}
                  textareaProps={{ placeholder: 'Write your blog in markdown...' }} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Publish */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Publish</h3>
              <div className="space-y-3">
                <button onClick={() => handleSubmit(false)} disabled={saving}
                  className="w-full py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium text-sm hover:bg-surface-50 dark:hover:bg-white/5 transition-all disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button onClick={() => handleSubmit(true)} disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-60">
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Category</h3>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <HiOutlineTag className="w-4 h-4" /> Tags
              </h3>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="react, javascript, web"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              <p className="text-xs text-surface-400 mt-1">Separate with commas</p>
            </div>

            {/* Summary */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Summary</h3>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief description..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none h-24" />
            </div>

            {/* AI Tools */}
            <div className="glass-card rounded-2xl p-5 mb-4 bg-gradient-to-br from-primary-500/10 to-transparent border-primary-500/20">
              <h3 className="font-semibold text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2">
                <HiOutlineLightningBolt className="w-5 h-5" /> Auto-Generate
              </h3>
              <button onClick={() => handleAI('full-blog')} disabled={!!aiLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {aiLoading === 'full-blog' ? 'Generating Magic...' : 'Generate Full Blog Post'}
              </button>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4 text-primary-500" /> AI Helpers
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'title', label: 'Generate Title' },
                  { key: 'summary', label: 'Generate Summary' },
                  { key: 'tags', label: 'Suggest Tags' },
                  { key: 'improve', label: 'Improve Content' },
                ].map(tool => (
                  <button key={tool.key} onClick={() => handleAI(tool.key)} disabled={!!aiLoading}
                    className="w-full py-2 px-3 rounded-xl text-sm text-left text-surface-700 dark:text-surface-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all disabled:opacity-50 flex items-center justify-between">
                    {tool.label}
                    {aiLoading === tool.key && <span className="text-xs text-primary-500">Loading...</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
