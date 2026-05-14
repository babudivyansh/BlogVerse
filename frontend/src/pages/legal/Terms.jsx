import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineLightBulb, HiOutlineScale } from 'react-icons/hi';
import SEO from '../../components/common/SEO';

export default function Terms() {
  const rules = [
    {
      icon: HiOutlineDocumentText,
      title: "Creative Ownership",
      content: "You are the soul of your content. You retain 100% ownership of everything you write. By publishing, you simply grant BlogVerse the light to host and share your work with the community."
    },
    {
      icon: HiOutlineUserGroup,
      title: "Community Conduct",
      content: "Respect the Verse. We do not tolerate hate speech, harassment, or unlawful content. We reserve the right to archive narratives that disrupt the harmony of our creative ecosystem."
    },
    {
      icon: HiOutlineLightBulb,
      title: "AI Muse Ethics",
      content: "AI tools are meant to inspire, not replace. You are responsible for reviewing and refining all AI-generated content before it becomes part of your public portfolio."
    },
    {
      icon: HiOutlineScale,
      title: "Fair Use",
      content: "Access to BlogVerse is a privilege. We strive for 99.9% uptime, but we are not liable for temporary outages or data loss beyond our reasonable control. Always keep a personal backup of your masterpieces."
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-20">
      <SEO title="Terms of Resonance" description="Our guidelines for maintaining a high-end, creative, and respectful community in the BlogVerse." />
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-7xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-6">
            Terms of <span className="text-primary-500">Service.</span>
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 font-medium max-w-2xl mx-auto">
            The guidelines that keep the Verse thriving. By using BlogVerse, you agree to these principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rules.map((rule, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glassium-card glint-border p-10 group hover:bg-white/50 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <rule.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-surface-800 dark:text-white font-heading mb-4">{rule.title}</h3>
              <p className="text-surface-600 dark:text-surface-400 font-medium leading-relaxed">
                {rule.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">Last Modified: May 13, 2026</p>
        </div>
      </div>
    </motion.div>
  );
}
