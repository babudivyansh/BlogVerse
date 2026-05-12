import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineEye, HiOutlineClock } from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogCard({ blog, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/blog/${blog.slug}`} className="group block">
        <div className="glass rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-2">
          {/* Cover image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-100 dark:bg-surface-800">
            {blog.cover_image ? (
              <img src={blog.cover_image} alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full gradient-bg opacity-50" />
            )}
            {blog.category && (
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white bg-primary-500/90 backdrop-blur-sm rounded-full">
                {blog.category}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {blog.tags.slice(0, 3).map(tag => (
                  <span key={tag.id || tag.name} className="px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 rounded-md">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {blog.title}
            </h3>

            {blog.summary && (
              <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-4 leading-relaxed">
                {blog.summary}
              </p>
            )}

            {/* Author + Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-semibold">
                  {blog.author?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-700 dark:text-surface-300">{blog.author?.full_name || blog.author?.username}</p>
                  <p className="text-[11px] text-surface-400 dark:text-surface-500">
                    {blog.created_at ? format(new Date(blog.created_at), 'MMM d, yyyy') : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-surface-400 dark:text-surface-500">
                <span className="flex items-center gap-1 text-xs"><HiOutlineClock className="w-3.5 h-3.5" /> {blog.read_time}m</span>
                <span className="flex items-center gap-1 text-xs"><HiOutlineEye className="w-3.5 h-3.5" /> {blog.views}</span>
                <span className="flex items-center gap-1 text-xs"><HiOutlineHeart className="w-3.5 h-3.5" /> {blog.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
