import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSave } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getBlogs, suggestStoryContent, createStory, updateStory, getStoryById, formatImageUrl, aiGenerateCover } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

const CreateStory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Blog, 2: Edit Slides
  const [creationMode, setCreationMode] = useState(null); // 'blog' or 'scratch'
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState([
    { title: '', text: '', image_url: '', order_index: 0 }
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      loadStoryForEdit(editId);
    } else {
      fetchBlogs();
    }
  }, [user]);

  const loadStoryForEdit = async (id) => {
    setLoading(true);
    try {
      const { data } = await getStoryById(id);
      setTitle(data.title);
      setPages(data.pages.sort((a, b) => a.order_index - b.order_index));
      setSelectedBlog(data.blog_id ? { id: data.blog_id } : null);
      setCreationMode(data.blog_id ? 'blog' : 'scratch');
      setStep(2);
      setEditId(id);
    } catch (err) {
      toast.error('Failed to load story for editing');
      fetchBlogs();
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await getBlogs({ author: user.username, status: 'published', limit: 50 });
      setBlogs(res.data.items);
    } catch (err) {
      toast.error('Failed to load your blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBlog = (blog) => {
    setSelectedBlog(blog);
    setTitle(blog.title);
    setCreationMode('blog');
    setStep(2);
  };

  const handleStartFromScratch = () => {
    setSelectedBlog(null);
    setTitle('');
    setPages([{ title: '', text: '', image_url: '', order_index: 0 }]);
    setCreationMode('scratch');
    setStep(2);
  };

  const handleAISuggest = async () => {
    if (!selectedBlog) {
      toast.error('Connect a blog first to use AI suggestions');
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await suggestStoryContent(selectedBlog.id);
      const suggestedPages = data.map((slide, i) => ({
        title: slide.title,
        text: slide.text,
        image_url: '', 
        visual_prompt: slide.visual_prompt,
        order_index: i
      }));
      setPages(suggestedPages);
      setCurrentPage(0);
      toast.success('AI suggestions loaded!');
    } catch (err) {
      toast.error('Failed to get suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data } = await uploadImage(file);
      const newPages = [...pages];
      newPages[currentPage].image_url = data.url;
      setPages(newPages);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async (index) => {
    const page = pages[index];
    if (!page.visual_prompt && !page.title) {
      toast.error('Add a title or prompt first');
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data } = await aiGenerateCover({ 
        title: page.title, 
        summary: page.text, 
        prompt: page.visual_prompt,
        width: 720,
        height: 1280
      });
      const newPages = [...pages];
      newPages[index].image_url = data.url;
      setPages(newPages);
      toast.success('Image generated!');
    } catch (err) {
      toast.error('Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const addPage = () => {
    setPages([...pages, { title: '', text: '', image_url: '', order_index: pages.length }]);
    setCurrentPage(pages.length);
  };

  const removePage = (index) => {
    if (pages.length === 1) return;
    const newPages = pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, order_index: i }));
    setPages(newPages);
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const updatePage = (field, value) => {
    const newPages = [...pages];
    newPages[currentPage][field] = value;
    setPages(newPages);
  };

  const handleSubmit = async (status = 'published') => {
    if (!title || pages.some(p => !p.title || !p.image_url)) {
      toast.error('Please fill all fields and add images for all slides');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        blog_id: selectedBlog?.id || null,
        title,
        status,
        pages
      };

      if (editId) {
        await updateStory(editId, payload);
        toast.success('Web Story updated successfully!');
      } else {
        await createStory(payload);
        toast.success('Web Story created successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(editId ? 'Failed to update story' : 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Step 1: Mode Selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h1 className="text-4xl md:text-6xl font-black text-surface-800 dark:text-white font-heading tracking-tight">Create Visual Tale</h1>
                <p className="text-surface-500 font-bold uppercase tracking-widest text-xs mt-3">Choose your creation path</p>
              </div>
              <button 
                onClick={handleStartFromScratch}
                className="btn-glassium-secondary group flex items-center gap-3 px-8 py-4 border-2 border-primary-500/20 hover:border-primary-500 transition-all"
              >
                <HiOutlinePlus className="group-hover:rotate-90 transition-transform" />
                <span>Start from Scratch</span>
              </button>
            </div>

            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary-500 mb-8">Convert from Blog (AI Assisted)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(blog => (
                <div 
                  key={blog.id} 
                  onClick={() => handleSelectBlog(blog)}
                  className="glassium-card glint-border p-6 cursor-pointer hover:scale-105 transition-all group"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden mb-6 relative">
                    <img src={formatImageUrl(blog.cover_image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-black text-lg line-clamp-2 group-hover:text-primary-500 transition-colors font-heading leading-tight">{blog.title}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-surface-400">
                    <HiOutlineSparkles className="text-primary-500" />
                    Convert to Story
                  </div>
                </div>
              ))}
              {blogs.length === 0 && (
                <div className="col-span-full py-20 text-center glassium-card glint-border border-dashed border-2">
                  <p className="text-surface-400 font-bold">No published blogs found. Start from scratch or publish a blog first!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Editor */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Preview/Editor */}
            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setStep(1)} className="flex items-center text-surface-500 font-black uppercase tracking-widest text-[10px] hover:text-surface-800 dark:hover:text-white transition-colors">
                  <HiOutlineChevronLeft className="mr-2" /> Back to Selection
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSubmit('draft')}
                    className="flex items-center px-6 py-2.5 bg-surface-200 dark:bg-white/5 text-surface-600 dark:text-surface-400 border border-surface-300 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-300 dark:hover:bg-white/10 transition-all"
                  >
                    Save Draft
                  </button>
                  {creationMode === 'blog' && (
                    <button 
                      onClick={handleAISuggest}
                      disabled={isGenerating}
                      className="flex items-center px-6 py-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                    >
                      <HiOutlineSparkles className="mr-2" /> {isGenerating ? 'Synthesizing...' : 'AI Suggest Content'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleSubmit('published')}
                    className="flex items-center px-8 py-2.5 bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    <HiOutlineSave className="mr-2" /> Publish Tale
                  </button>
                </div>
              </div>

              <div className="glassium-card glint-border overflow-hidden">
                <div className="p-10 space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-3 block">Tale Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none text-3xl md:text-4xl font-black text-surface-800 dark:text-white focus:ring-0 p-0 font-heading"
                      placeholder="Give your story a name..."
                    />
                  </div>

                  {/* Current Page Editor */}
                  <div className="flex flex-col md:flex-row gap-10 mt-12">
                    {/* Visual Preview & Controls */}
                    <div className="w-full md:w-72 shrink-0">
                      <div className="aspect-[9/16] bg-surface-900 rounded-[2rem] overflow-hidden relative group shadow-2xl border border-white/5">
                        {pages[currentPage].image_url ? (
                          <img src={formatImageUrl(pages[currentPage].image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-4">
                            <HiOutlinePhotograph size={64} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Visual Set</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent p-6 flex flex-col justify-end">
                          <h4 className="text-white font-black text-sm mb-1 font-heading leading-tight">{pages[currentPage].title || 'Slide Title'}</h4>
                          <p className="text-white/60 text-[10px] font-medium line-clamp-2">{pages[currentPage].text || 'Slide Content'}</p>
                        </div>
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                          <button 
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            className="w-48 py-3 bg-white text-surface-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl"
                          >
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                          </button>
                          <div className="text-white/40 text-[10px] font-black uppercase">Or</div>
                          <button 
                            onClick={() => handleGenerateImage(currentPage)}
                            disabled={isGenerating}
                            className="w-48 py-3 bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl flex items-center justify-center gap-2"
                          >
                            <HiOutlineSparkles size={16} />
                            {isGenerating ? 'Generating...' : 'AI Generate'}
                          </button>
                        </div>
                      </div>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>

                    {/* Text Inputs */}
                    <div className="flex-1 space-y-8">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-3 block">Slide Heading</label>
                        <input 
                          type="text"
                          value={pages[currentPage].title}
                          onChange={(e) => updatePage('title', e.target.value)}
                          className="w-full glass-input rounded-2xl p-5 font-bold text-surface-800 dark:text-white text-lg focus:ring-primary-500/20"
                          placeholder="Headline for this slide"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-3 block">Narrative Body</label>
                        <textarea 
                          value={pages[currentPage].text}
                          onChange={(e) => updatePage('text', e.target.value)}
                          className="w-full glass-input rounded-2xl p-5 font-medium text-surface-700 dark:text-surface-200 h-40 resize-none leading-relaxed"
                          placeholder="Craft a short, impactful message..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-3 block">Visual Guidance (AI Prompt)</label>
                        <textarea 
                          value={pages[currentPage].visual_prompt || ''}
                          onChange={(e) => updatePage('visual_prompt', e.target.value)}
                          className="w-full glass-input rounded-2xl p-5 text-xs font-medium text-surface-500 dark:text-surface-400 h-24 resize-none"
                          placeholder="Optional: Describe the scene for AI image generation..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Slide Navigator */}
            <div className="lg:col-span-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-surface-400">Tale Navigator</h3>
                <span className="text-[10px] font-black text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full">{pages.length} Slides</span>
              </div>
              
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar">
                {pages.map((p, i) => (
                  <motion.div 
                    key={i}
                    layoutId={`slide-${i}`}
                    onClick={() => setCurrentPage(i)}
                    className={`p-5 rounded-3xl flex items-center gap-5 cursor-pointer border-2 transition-all duration-300 relative overflow-hidden group ${currentPage === i ? 'bg-primary-500/5 border-primary-500 shadow-xl shadow-primary-500/5' : 'glassium-card border-transparent hover:border-white/10'}`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-surface-900 overflow-hidden shrink-0 shadow-inner border border-white/5">
                      {p.image_url && <img src={formatImageUrl(p.image_url)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black uppercase tracking-widest mb-1 ${currentPage === i ? 'text-primary-500' : 'text-surface-400'}`}>Slide {i + 1}</p>
                      <p className="text-sm font-bold text-surface-800 dark:text-white line-clamp-1 leading-tight">{p.title || 'Untitled Slide'}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePage(i); }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </motion.div>
                ))}
                
                <button 
                  onClick={addPage}
                  className="w-full p-8 rounded-3xl border-2 border-dashed border-surface-200 dark:border-white/10 text-surface-400 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/5 transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiOutlinePlus size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">New Chapter</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CreateStory;
