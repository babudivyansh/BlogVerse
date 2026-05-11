import { Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg">B</div>
              <span className="text-xl font-bold gradient-text">BlogVerse</span>
            </Link>
            <p className="text-surface-500 dark:text-surface-400 text-sm leading-relaxed max-w-sm">
              A modern blog platform powered by AI. Write, share, and discover amazing content with our community of writers.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
                <FaTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
                <FaGithub className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
                <FaLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[{ to: '/', label: 'Home' }, { to: '/search', label: 'Explore' }, { to: '/create', label: 'Write' }].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Categories</h4>
            <ul className="space-y-2">
              {['Technology', 'Design', 'Programming', 'AI & ML'].map(c => (
                <li key={c}>
                  <Link to={`/search?category=${c}`} className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            © {new Date().getFullYear()} BlogVerse. All rights reserved.
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
            Made with <HiOutlineHeart className="w-4 h-4 text-red-500" /> by BlogVerse Team
          </p>
        </div>
      </div>
    </footer>
  );
}
