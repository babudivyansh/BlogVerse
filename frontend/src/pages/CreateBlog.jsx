import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { HiOutlineSparkles, HiOutlinePhotograph, HiOutlineTag, HiOutlineLightningBolt, HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlineDotsHorizontal, HiOutlineHashtag } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { createBlog, updateBlog, getBlog, uploadImage, aiGenerateTitle, aiGenerateSummary, aiSuggestTags, aiImproveContent, aiGenerateBlog, formatImageUrl } from '../services/api';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-surface-400 hover:text-primary-500 transition-colors mb-6 group">
              <HiOutlineArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              Back to Studio
            </Link>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-800 dark:text-white font-heading tracking-tight leading-[1.1]">
              Craft Your <span className="text-primary-500">Narrative.</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => handleSubmit(false)} disabled={saving}
              className="px-8 py-4 rounded-2xl glassium text-surface-600 dark:text-surface-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border-white/20">
              {saving ? 'Preserving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="btn-glassium-primary px-10 py-4 text-xs">
              {saving ? 'Broadcasting...' : 'Publish Story'}
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-12">
          {/* Main Writing Canvas */}
          <div className="flex-1 space-y-10">
            <div className="glassium-card glint-border p-1 shadow-2xl">
              <div className="p-8 sm:p-12">
                <div className="group mb-12">
                  <div className="glass-input rounded-[2rem] p-6 group-hover:border-primary-500/30 transition-all cursor-text">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title of your next masterpiece..."
                      className="w-full text-4xl sm:text-6xl font-black bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder:text-surface-200 dark:placeholder:text-surface-800 font-heading tracking-tight cursor-text" />
                  </div>
                </div>

                {/* Cover Image Slot */}
                <div className="mb-12">
                  {coverImage ? (
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl glint-border group">
                      <img src={formatImageUrl(coverImage)} alt="Cover" className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-[3s]" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => setCoverImage('')}
                          className="px-6 py-3 glassium text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all">Change Cover</button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-6 p-20 rounded-[2.5rem] border-2 border-dashed border-surface-200 dark:border-white/5 glassium cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/[0.02] transition-all group">
                      <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner">
                        <HiOutlinePhotograph className="w-10 h-10 text-primary-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-surface-800 dark:text-white font-heading mb-2">Visual Aura</p>
                        <p className="text-sm font-bold text-surface-400">Add a stunning cover image to captivate readers</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>

                {/* Editor Container */}
                <div className="group">
                  <div className="glass-input rounded-[2.5rem] overflow-hidden border-white/20 group-hover:border-primary-500/30 transition-all" data-color-mode={dark ? 'dark' : 'light'}>
                    <MDEditor value={content} onChange={setContent} height={700}
                      preview="live" hideToolbar={false}
                      textareaProps={{ placeholder: 'The canvas is yours. Write something profound...' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Intelligence & Metadata Sidebar */}
          <div className="w-full xl:w-[400px] space-y-10">
            {/* AI Magic Box */}
            <div className="glassium-card glint-border p-8 bg-gradient-to-br from-primary-500/[0.08] to-transparent border-primary-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-primary-600 dark:text-primary-400 flex items-center gap-3 font-heading">
                  <HiOutlineLightningBolt className="w-6 h-6 animate-pulse" /> AI Muse
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-500/60">Powered by Gemini</span>
              </div>

              <button onClick={() => handleAI('full-blog')} disabled={!!aiLoading}
                className="btn-glassium-primary w-full py-5 text-sm mb-8 flex items-center justify-center gap-3 group">
                <HiOutlineSparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {aiLoading === 'full-blog' ? 'Manifesting Story...' : 'Generate Full Draft'}
              </button>
              
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-primary-500/10">
                {[
                  { key: 'title', label: 'Headline', Icon: HiOutlineDocumentText },
                  { key: 'summary', label: 'Summary', Icon: HiOutlineDotsHorizontal },
                  { key: 'tags', label: 'Tags', Icon: HiOutlineHashtag },
                  { key: 'improve', label: 'Refine', Icon: HiOutlineSparkles },
                ].map(tool => (
                  <button key={tool.key} onClick={() => handleAI(tool.key)} disabled={!!aiLoading}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl glassium hover:bg-primary-500/[0.05] hover:text-primary-500 transition-all group disabled:opacity-50">
                    <tool.Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tool.label}</span>
                    {aiLoading === tool.key && <div className="w-full h-0.5 bg-primary-500 animate-pulse mt-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Context & Taxonomy */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Context</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Metadata</span>
              </div>
              
              <div className="space-y-4">
                {/* Domain Card */}
                <div className="glassium-card glint-border p-6 shadow-xl group hover:bg-white/50 dark:hover:bg-white/[0.02] transition-all cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl glassium flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform">
                      <HiOutlineDocumentText className="w-5 h-5" />
                    </div>
                    <label className="text-[10px] font-black text-surface-500 dark:text-surface-400 uppercase tracking-[0.2em] cursor-pointer">Story Domain</label>
                  </div>
                  <div className="relative glass-input rounded-xl p-1 group-hover:border-primary-500/30 transition-all">
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent border-none text-lg font-black text-surface-800 dark:text-white outline-none appearance-none cursor-pointer">
                      <option value="" className="dark:bg-surface-900">Choose Category</option>
                      {categories.map(c => <option key={c} value={c} className="dark:bg-surface-900">{c}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
                      <HiOutlineDotsHorizontal className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Essences Card */}
                <div className="glassium-card glint-border p-6 shadow-xl group hover:bg-white/50 dark:hover:bg-white/[0.02] transition-all cursor-text">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl glassium flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform">
                      <HiOutlineHashtag className="w-5 h-5" />
                    </div>
                    <label className="text-[10px] font-black text-surface-500 dark:text-surface-400 uppercase tracking-[0.2em] cursor-text">The Essences</label>
                  </div>
                  <div className="glass-input rounded-xl p-1 group-hover:border-primary-500/30 transition-all">
                    <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, mind, future..."
                      className="w-full px-4 py-3 bg-transparent border-none text-lg font-black text-surface-800 dark:text-white outline-none placeholder:text-surface-300 dark:placeholder:text-surface-700 cursor-text" />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="glassium-card glint-border p-6 shadow-xl group hover:bg-white/50 dark:hover:bg-white/[0.02] transition-all cursor-text">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl glassium flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform">
                      <HiOutlineDotsHorizontal className="w-5 h-5" />
                    </div>
                    <label className="text-[10px] font-black text-surface-500 dark:text-surface-400 uppercase tracking-[0.2em] cursor-text">Narrative Aura</label>
                  </div>
                  <div className="glass-input rounded-xl p-1 group-hover:border-primary-500/30 transition-all">
                    <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="A brief reflection of your story..."
                      className="w-full px-4 py-3 bg-transparent border-none text-lg font-black text-surface-800 dark:text-white outline-none placeholder:text-surface-300 dark:placeholder:text-surface-700 resize-none h-32 leading-relaxed cursor-text" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
