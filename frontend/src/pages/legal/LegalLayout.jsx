import { motion } from 'framer-motion';

export default function LegalLayout({ title, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen pt-40 pb-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="glassium-card glint-border p-10 sm:p-16 mb-12">
          <h1 className="text-4xl sm:text-6xl font-black text-surface-800 dark:text-white font-heading tracking-tight mb-12 text-center">
            {title}
          </h1>
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:font-heading prose-p:text-surface-600 dark:prose-p:text-surface-400 prose-p:font-medium leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
