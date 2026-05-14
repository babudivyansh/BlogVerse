import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { HiOutlineSearch } from 'react-icons/hi';
import { getBlogs, getCategories, getTags } from '../services/api';
import BlogCard from '../components/blog/BlogCard';
import Loading from '../components/common/Loading';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';

  useEffect(() => {
    Promise.allSettled([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (tagRes.status === 'fulfilled') setAllTags(tagRes.value.data);
    });
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [searchParams, page]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      const q = searchParams.get('q');
      const cat = searchParams.get('category');
      const tag = searchParams.get('tag');
      if (q) params.search = q;
      if (cat) params.category = cat;
      if (tag) params.tag = tag;
      const res = await getBlogs(params);
      setBlogs(res.data.items);
      setTotalPages(res.data.pages);
    } catch {}
    setLoading(false);
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

  return (
    <div className="min-h-screen pt-32 pb-20">
      <Helmet>
        <title>{query ? `Search: ${query} | BlogVerse` : activeCategory ? `${activeCategory} | BlogVerse` : 'Explore Insights | BlogVerse'}</title>
        <meta name="description" content="Discover the latest insights, tutorials, and stories on BlogVerse. Filter by category or search for specific topics." />
      </Helmet>
      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-20">
        {/* Search bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-black text-center text-surface-800 dark:text-white mb-10 font-heading tracking-tight">Discover Stories</h1>
          <form onSubmit={handleSearch} className="relative">
            <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="What are you curious about?"
              className="w-full pl-16 pr-6 py-5 rounded-[2rem] glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white font-bold text-lg outline-none" />
          </form>
        </div>

        {/* Filters */}
        <div className="glassium-card glint-border p-8 mb-12 space-y-8">
          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-surface-500 uppercase tracking-[0.2em] mb-4 px-2">Categories</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setFilter('category', '')}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${!activeCategory ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 dark:hover:bg-white/5 text-surface-600 dark:text-surface-300'}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => setFilter('category', cat.name)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${activeCategory === cat.name ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 dark:hover:bg-white/5 text-surface-600 dark:text-surface-300'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-surface-500 uppercase tracking-[0.2em] mb-4 px-2">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 15).map(tag => (
                  <button key={tag.id} onClick={() => setFilter('tag', activeTag === tag.name ? '' : tag.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTag === tag.name ? 'bg-primary-500 text-white shadow-md' : 'glassium text-primary-600 dark:text-primary-400'}`}>
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? <Loading /> : blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {blogs.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-16">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={`w-12 h-12 rounded-2xl text-sm font-black transition-all ${page === i + 1 ? 'bg-primary-500 text-white shadow-lg' : 'glassium hover:bg-white/10 dark:hover:bg-white/5 text-surface-600 dark:text-surface-300'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 glassium-card glint-border border-dashed border-2">
            <p className="text-surface-400 font-black text-2xl">The verse is silent.</p>
            <p className="text-surface-400 font-bold mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
