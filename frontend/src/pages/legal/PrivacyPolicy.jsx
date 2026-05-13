import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineDatabase, HiOutlineGlobe, HiOutlineLockClosed } from 'react-icons/hi';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: HiOutlineShieldCheck,
      title: "Data Guardianship",
      content: "At BlogVerse, we treat your data as a sacred narrative. We collect only what is essential to provide you with a seamless writing experience, primarily your account details and the masterpieces you create."
    },
    {
      icon: HiOutlineDatabase,
      title: "How We Use Data",
      content: "Your information powers the Verse. We use it to maintain your profile, manage your drafts, and refine our AI Muse services. We never sell your personal stories to third-party advertisers."
    },
    {
      icon: HiOutlineGlobe,
      title: "AI Integration",
      content: "When you invoke the AI Muse, your text is processed through Google's Gemini API. This occurs via secure, encrypted channels ensuring your creative process remains private and protected."
    },
    {
      icon: HiOutlineLockClosed,
      title: "Your Control",
      content: "You are the author of your data. You can edit, archive, or permanently delete your content and account at any time. We respect the finality of your creative decisions."
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-7xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-6">
            Privacy <span className="text-primary-500">Manifesto.</span>
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 font-medium max-w-2xl mx-auto">
            Transparency is the foundation of trust. Here is how we protect your digital footprint in the BlogVerse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glassium-card glint-border p-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-8 shadow-inner">
                <section.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-surface-800 dark:text-white font-heading mb-4">{section.title}</h3>
              <p className="text-surface-600 dark:text-surface-400 font-medium leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 glassium-card glint-border p-12 text-center">
          <h2 className="text-3xl font-black text-surface-800 dark:text-white font-heading mb-6">Cookie Policy</h2>
          <p className="text-surface-600 dark:text-surface-400 font-medium max-w-3xl mx-auto leading-relaxed">
            We use essential cookies to remember your theme preferences and maintain your secure session. These are minimal, transparent, and designed solely to enhance your creative flow.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
