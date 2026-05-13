import { motion } from 'framer-motion';
import { HiOutlineQuestionMarkCircle, HiOutlineSparkles, HiOutlineColorSwatch, HiOutlineUserCircle } from 'react-icons/hi';

export default function HelpCenter() {
  const faqs = [
    {
      icon: HiOutlineSparkles,
      category: "AI MUSE",
      question: "How do I generate content with AI?",
      answer: "In the Write section, use the AI Muse sidebar to generate headlines, summaries, or full drafts. Just provide a topic and watch the AI manifest your narrative."
    },
    {
      icon: HiOutlineColorSwatch,
      category: "AESTHETICS",
      question: "How do I switch to Dark Mode?",
      answer: "Toggle the celestial icon (Sun/Moon) in the top right of your Navigation bar to switch between our signature Light and Dark Glassium themes."
    },
    {
      icon: HiOutlineUserCircle,
      category: "ACCOUNT",
      question: "Can I customize my profile?",
      answer: "Absolutely. Visit your Profile page to update your bio, social links, and display name to reflect your unique digital identity."
    },
    {
      icon: HiOutlineQuestionMarkCircle,
      category: "SUPPORT",
      question: "Still have questions?",
      answer: "Our team is here for you. Navigate to the Contact Us page to send a direct message into the Verse, and we'll get back to you within 24 hours."
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-24">
          <h1 className="text-5xl sm:text-7xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-6">
            Help <span className="text-primary-500">Center.</span>
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 font-medium max-w-2xl mx-auto">
            Guidance for your journey through the BlogVerse. Find answers to common reflections below.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glassium-card glint-border p-8 sm:p-12 hover:scale-[1.01] transition-all cursor-default"
            >
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 shadow-inner">
                  <faq.icon className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-3 block">
                    {faq.category}
                  </span>
                  <h3 className="text-2xl font-black text-surface-800 dark:text-white font-heading mb-4">
                    {faq.question}
                  </h3>
                  <p className="text-lg text-surface-600 dark:text-surface-400 font-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center p-16 glassium-card glint-border bg-gradient-to-br from-primary-500/[0.05] to-transparent">
          <h2 className="text-3xl font-black text-surface-800 dark:text-white font-heading mb-6">Need Deep Support?</h2>
          <p className="text-surface-500 font-medium mb-10 max-w-xl mx-auto">
            If you're facing a technical challenge or have a specific inquiry, our human team is ready to assist.
          </p>
          <a href="/contact" className="btn-glassium-primary px-12 py-5 text-lg inline-block">
            Contact Support
          </a>
        </div>
      </div>
    </motion.div>
  );
}
