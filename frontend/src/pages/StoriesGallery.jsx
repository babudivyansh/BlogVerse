import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStories, getStory, formatImageUrl, getCategories, getTags } from '../services/api';
import WebStoryViewer from '../components/stories/WebStoryViewer';
import { IoPlayCircle, IoChevronForward } from 'react-icons/io5';
import { HiOutlineSearch } from 'react-icons/hi';
import Loading from '../components/common/Loading';
import SEO from '../components/common/SEO';

const StoriesGallery = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [page, setPage] = useState(1);

  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';

  useEffect(() => {
    Promise.allSettled([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (tagRes.status === 'fulfilled') setAllTags(tagRes.value.data);
    });
  }, []);

  useEffect(() => {
    fetchStories();
    if (slug) {
      openStory(slug);
    }
  }, [slug, searchParams, page]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      const q = searchParams.get('q');
      const cat = searchParams.get('category');
      const tag = searchParams.get('tag');
      if (q) params.search = q;
      if (cat) params.category = cat;
      if (tag) params.tag = tag;
      
      const { data } = await getStories(params);
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStory = async (slug) => {
    try {
      const { data } = await getStory(slug);
      setSelectedStory(data);
    } catch (error) {
      console.error('Error fetching story details:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (activeCategory) params.category = activeCategory;
    if (activeTag) params.tag = activeTag;
    setSearchParams(params);
  };

  const setFilter = (key, value) => {
    setPage(1);
    const params = Object.fromEntries(searchParams.entries());
    if (value) params[key] = value;
    else delete params[key];
    setSearchParams(params);
  };

  const featuredStory = stories[0];
  const otherStories = stories.slice(1);

  return (
    <div className="min-h-screen pt-32 pb-24">
      <SEO 
        title="Visual Tales | BlogVerse" 
        description="Explore cinematic AI-powered web stories by category and topic."
      />

      <div className="max-w-[1600px] mx-auto px-8 sm:px-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
            Discover The Visual Frontier
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-surface-800 dark:text-white mb-8 font-heading tracking-tight"
          >
            Visual <span className="text-primary-500">Tales</span>
          </motion.h1>

          <form onSubmit={handleSearch} className="relative mb-12">
            <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-500" />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Search visual narratives..."
              className="w-full pl-16 pr-8 py-5 rounded-[2rem] glassium glint-border focus:ring-4 focus:ring-primary-500/20 text-surface-800 dark:text-white font-bold text-lg outline-none shadow-xl transition-all" 
            />
          </form>
        </div>

        {/* Filters Panel */}
        <div className="glassium-card glint-border p-6 mb-16 space-y-6 shadow-lg">
          {categories.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.3em] mb-4 px-2 flex items-center gap-3">
                <div className="w-6 h-0.5 bg-primary-500/30 rounded-full" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setFilter('category', '')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 text-surface-500'}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => setFilter('category', cat.name)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat.name ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 text-surface-500'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {allTags.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.3em] mb-4 px-2 flex items-center gap-3">
                <div className="w-6 h-0.5 bg-primary-500/30 rounded-full" />
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 15).map(tag => (
                  <button key={tag.id} onClick={() => setFilter('tag', activeTag === tag.name ? '' : tag.name)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTag === tag.name ? 'bg-primary-500 text-white shadow-md' : 'glassium text-primary-500 hover:bg-primary-500/10'}`}>
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loading />
          </div>
        ) : stories.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 glassium-card glint-border border-dashed border-2"
          >
            <p className="text-surface-400 font-black text-2xl">The gallery is currently being curated.</p>
            <p className="text-surface-500 mt-2 font-bold uppercase tracking-widest text-xs">Try adjusting your filters to find a tale</p>
          </motion.div>
        ) : (
          <div className="space-y-20">
            {/* Premiere Collection (Horizontal Scrolling Shelf) */}
            {!activeCategory && !activeTag && !query && page === 1 && (
              <div className="mb-20">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-2xl font-black text-surface-800 dark:text-white tracking-tight flex items-center gap-4 font-heading">
                    <div className="w-12 h-1 bg-primary-500 rounded-full" />
                    Premiere Collection
                  </h3>
                  <div className="hidden md:flex gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-surface-400">
                    Scroll To Explore <IoChevronForward className="w-4 h-4 text-primary-500" />
                  </div>
                </div>

                <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2 -mx-2 snap-x snap-mandatory">
                  {stories.slice(0, 5).map((story, i) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex-shrink-0 w-[280px] md:w-[320px] aspect-[9/16] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl snap-start"
                      onClick={() => openStory(story.slug)}
                    >
                      {story.cover_image ? (
                        <img 
                          src={formatImageUrl(story.cover_image)} 
                          alt={story.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-surface-800 to-surface-950"
                        style={{ display: story.cover_image ? 'none' : 'block' }}
                      />
                      {/* Cinematic Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100">
                         <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 text-white">
                           <IoPlayCircle size={40} />
                         </div>
                      </div>
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <span className="px-3 py-1 bg-primary-500 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-lg shadow-xl">Story</span>
                             <span className="text-white/60 text-[8px] font-black uppercase tracking-[0.4em]">Cinematic</span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-white mb-2 font-heading tracking-tight leading-[1.2] group-hover:text-primary-400 transition-colors duration-300">
                            {story.title}
                          </h2>
                          <div className="flex items-center gap-3 text-white/40 group-hover:text-primary-400 transition-colors">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Watch Now</span>
                            <IoChevronForward className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Tales Grid */}
            <div className="space-y-10">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black text-surface-800 dark:text-white tracking-tight flex items-center gap-4 font-heading">
                  <div className="w-12 h-1 bg-primary-500 rounded-full" />
                  {activeCategory ? `Tales in ${activeCategory}` : activeTag ? `Topic: #${activeTag}` : 'Latest Chapters'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {(activeCategory || activeTag || query || page > 1 ? stories : otherStories).map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -10 }}
                    onClick={() => openStory(story.slug)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl mb-6 ring-1 ring-white/10 transition-all duration-500">
                      {story.cover_image ? (
                        <img 
                          src={formatImageUrl(story.cover_image)} 
                          alt={story.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-surface-800 to-surface-950"
                        style={{ display: story.cover_image ? 'none' : 'block' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100">
                         <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 text-white">
                           <IoPlayCircle size={40} />
                         </div>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-surface-700 dark:text-white group-hover:text-primary-500 transition-all duration-300 line-clamp-2 font-heading tracking-tight px-4">
                      {story.title}
                    </h4>
                    <p className="mt-3 text-[10px] font-black text-surface-400 uppercase tracking-[0.4em] px-4 flex items-center gap-3 group-hover:text-primary-400 transition-colors">
                      Experience <IoChevronForward className="w-4 h-4 text-primary-500 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewer Portal */}
      <AnimatePresence>
        {selectedStory && (
          <WebStoryViewer 
            story={selectedStory} 
            onClose={() => {
              setSelectedStory(null);
              if (slug) navigate('/stories');
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesGallery;
