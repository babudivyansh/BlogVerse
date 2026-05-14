import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';

export default function ContactUs() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Your message has been sent to the Verse!');
      setLoading(false);
      e.target.reset();
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen pt-40 pb-20"
    >
      <SEO title="Connect with Us" description="Reach out to the BlogVerse team for any inquiries, feedback, or collaboration opportunities." />
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-7xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-6">
            Connect with the <span className="text-primary-500">Verse.</span>
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 font-medium max-w-2xl mx-auto">
            Have a question, feedback, or a brilliant idea? Reach out and let's start a conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            {[
              { icon: HiOutlineMail, title: 'Email', value: 'hello@blogverse.com', desc: 'Our team typically responds within 24 hours.' },
              { icon: HiOutlineLocationMarker, title: 'Studio', value: 'Silicon Valley, CA', desc: 'Crafting digital experiences in the heart of innovation.' },
              { icon: HiOutlinePhone, title: 'Call', value: '+1 (555) BLOG-VRSE', desc: 'Available Mon-Fri, 9am-5pm PST.' },
            ].map((item, i) => (
              <div key={i} className="glassium-card glint-border p-8 flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner shrink-0">
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-surface-800 dark:text-white font-heading mb-1">{item.title}</h3>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-2">{item.value}</p>
                  <p className="text-sm font-medium text-surface-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="glassium-card glint-border p-10 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-surface-500 uppercase tracking-widest px-2">Name</label>
                  <input required type="text" placeholder="Your name" className="w-full px-6 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-surface-500 uppercase tracking-widest px-2">Email</label>
                  <input required type="email" placeholder="you@example.com" className="w-full px-6 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white font-bold outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-500 uppercase tracking-widest px-2">Subject</label>
                <input required type="text" placeholder="What's on your mind?" className="w-full px-6 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-500 uppercase tracking-widest px-2">Message</label>
                <textarea required rows="5" placeholder="Tell us more..." className="w-full px-6 py-4 rounded-2xl glassium glint-border focus:ring-2 focus:ring-primary-500/30 text-surface-800 dark:text-white font-bold outline-none resize-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-glassium-primary w-full py-5 text-lg">
                {loading ? 'Sending to the Verse...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
