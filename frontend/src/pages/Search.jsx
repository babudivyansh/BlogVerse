import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-bold text-center text-surface-900 dark:text-white mb-6">Explore Blogs</h1>
          <form onSubmit={handleSearch} className="relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-surface-900 dark:text-white text-sm" />
          </form>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('category', '')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${!activeCategory ? 'bg-primary-500 text-white' : 'glass-card text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => setFilter('category', cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat.name ? 'bg-primary-500 text-white' : 'glass-card text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 15).map(tag => (
                  <button key={tag.id} onClick={() => setFilter('tag', activeTag === tag.name ? '' : tag.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeTag === tag.name ? 'bg-primary-500 text-white' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary-500 text-white' : 'glass-card text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/5'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-surface-400 text-lg">No blogs found</p>
            <p className="text-surface-400 text-sm mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
