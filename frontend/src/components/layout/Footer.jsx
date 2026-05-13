import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineGlobeAlt, HiOutlineMail } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="w-full mt-auto rounded-t-3xl bg-white/40 dark:bg-surface-950/40 backdrop-blur-[24px] border-t border-white/30 dark:border-white/5 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 py-12 gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link to="/" className="text-headline-lg font-black text-primary-500 font-heading tracking-tight hover:scale-105 transition-transform">
            Blogverse
          </Link>
          <p className="text-sm font-bold text-surface-500 dark:text-surface-400">
            © {new Date().getFullYear()} Blogverse. Crystalline Clarity for Writers.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          {[
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'Terms of Service', to: '/terms' },
            { label: 'Help Center', to: '/help' },
            { label: 'Contact Us', to: '/contact' },
          ].map(link => (
            <Link key={link.label} to={link.to} className="text-sm font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-all uppercase tracking-widest">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-4">
          {[
            { Icon: HiOutlineGlobeAlt, label: 'Globe' },
            { Icon: HiOutlineMail, label: 'Email' },
            { Icon: HiOutlineHeart, label: 'Love' },
          ].map(item => (
            <div key={item.label} className="w-12 h-12 rounded-2xl glassium glint-border flex items-center justify-center cursor-pointer text-surface-500 hover:text-primary-500 hover:scale-110 transition-all shadow-sm">
              <item.Icon className="w-5 h-5" />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
