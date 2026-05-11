import { motion } from 'framer-motion';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full border-3 border-surface-200 dark:border-surface-700 border-t-primary-500"
      />
      <p className="text-sm text-surface-500 dark:text-surface-400">{text}</p>
    </div>
  );
}
