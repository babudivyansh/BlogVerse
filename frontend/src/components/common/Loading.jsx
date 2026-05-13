import { motion } from 'framer-motion';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-[2.5rem] glassium glint-border shadow-2xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-primary-500 border-r-primary-500/30"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-surface-500 dark:text-surface-300 animate-pulse">{text}</p>
    </div>
  );
}
