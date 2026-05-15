import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineEye, HiOutlineClock } from 'react-icons/hi';
import { format } from 'date-fns';
import { formatImageUrl } from '../../services/api';

export default function BlogCard({ blog, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Link to={`/blog/${blog.slug}`} className="group block h-full">
        <div className="glassium-card glint-border overflow-hidden h-full flex flex-col group-hover:shadow-[0_20px_50px_rgba(124,93,250,0.15)] group-hover:bg-white dark:group-hover:bg-white/5 transition-all duration-500">
          {/* Cover image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-100 dark:bg-surface-800 rounded-t-[1.5rem]">
            {blog.cover_image ? (
              <img src={formatImageUrl(blog.cover_image)} alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-80" />
            )}
            {blog.category && (
              <span className="absolute top-4 left-4 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-primary-500 rounded-full shadow-lg z-10">
                {blog.category}
              </span>
            )}
            {blog.web_story_slug && (
              <div className="absolute top-4 right-4 z-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 shadow-xl"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-7">
            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.slice(0, 2).map(tag => (
                  <span key={tag.id || tag.name} className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-500/10 rounded-lg">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-xl font-black text-surface-800 dark:text-white mb-3 line-clamp-2 leading-tight font-heading group-hover:text-primary-500 transition-colors">
              {blog.title}
            </h3>

            {blog.summary && (
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400 line-clamp-2 mb-6 leading-relaxed">
                {blog.summary}
              </p>
            )}

            {/* Author + Meta */}
            <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-black shadow-md overflow-hidden">
                  {blog.author?.avatar_url ? (
                    <img 
                      src={formatImageUrl(blog.author.avatar_url)} 
                      alt={blog.author.username} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = blog.author?.username?.[0]?.toUpperCase();
                      }}
                    />
                  ) : (
                    blog.author?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-800 dark:text-white leading-none mb-0.5">{blog.author?.username}</p>
                  <p className="text-[10px] font-medium text-surface-400">
                    {blog.created_at ? format(new Date(blog.created_at), 'MMM d') : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-surface-400">
                <span className="flex items-center gap-1 text-[11px] font-bold"><HiOutlineClock className="w-4 h-4 text-primary-400" /> {blog.read_time}m</span>
                <span className="flex items-center gap-1 text-[11px] font-bold"><HiOutlineHeart className="w-4 h-4 text-red-400" /> {blog.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
