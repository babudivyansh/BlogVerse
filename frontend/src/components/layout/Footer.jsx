import { Link } from 'react-router-dom';
import { FaInstagram, FaXTwitter, FaFacebook, FaThreads } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="w-full mt-auto rounded-t-3xl bg-white/40 dark:bg-surface-950/40 backdrop-blur-[24px] border-t border-white/30 dark:border-white/5 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 py-12 gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link to="/" className="hover:scale-105 transition-transform mb-2">
            <img src="/logo.png" alt="Blogverse" className="h-64 w-auto object-contain -my-20" />
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
            { Icon: FaInstagram, label: 'Instagram', color: 'hover:text-[#E4405F]', url: 'https://instagram.com/blogverse' },
            { Icon: FaXTwitter, label: 'X', color: 'hover:text-[#000000] dark:hover:text-white', url: 'https://x.com/blogverse' },
            { Icon: FaFacebook, label: 'Facebook', color: 'hover:text-[#1877F2]', url: 'https://facebook.com/blogverse' },
            { Icon: FaThreads, label: 'Threads', color: 'hover:text-[#000000] dark:hover:text-white', url: 'https://threads.net/blogverse' },
          ].map(item => (
            <a key={item.label} href={item.url} target="_blank" rel="noreferrer" 
              className={`w-12 h-12 rounded-2xl glassium glint-border flex items-center justify-center cursor-pointer text-surface-500 ${item.color} hover:scale-110 transition-all shadow-sm`}>
              <item.Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
