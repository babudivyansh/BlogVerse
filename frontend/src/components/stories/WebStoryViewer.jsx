import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5';

const WebStoryViewer = ({ story, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const pages = story?.pages || [];
  const duration = 6000;
  const timerRef = useRef(null);

  useEffect(() => {
    if (pages.length === 0) return;

    const startTimer = () => {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(timerRef.current);
          nextSlide();
        }
      }, 50);
    };

    startTimer();
    return () => clearInterval(timerRef.current);
  }, [currentIndex, pages.length]);

  const nextSlide = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleTap = (e) => {
    const { clientX } = e;
    const { innerWidth } = window;
    if (clientX < innerWidth / 3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  if (!story || pages.length === 0) return null;

  const currentPage = pages[currentIndex];

  const content = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-neutral-950 flex items-center justify-center overflow-hidden"
    >
      {/* Immersive Blur Backdrop */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          key={`bg-${currentIndex}`}
          src={currentPage.image_url} 
          className="w-full h-full object-cover scale-150 blur-[100px] opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Story Container */}
      <div className="relative z-10 w-full h-full max-w-[500px] md:h-[92vh] md:max-h-[900px] md:aspect-[9/16] md:rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.9)] bg-black border border-white/10">
        
        {/* Progress Bars */}
        <div className="absolute top-8 left-8 right-8 z-50 flex gap-2">
          {pages.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
              <div 
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-100 ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Cinematic Header */}
        <div className="absolute top-14 left-8 right-8 z-50 flex justify-between items-start text-white">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400 mb-1 drop-shadow-lg">Exploration</span>
            <h3 className="text-base font-black tracking-tight drop-shadow-2xl max-w-[240px] line-clamp-1">{story.title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl transition-all group active:scale-90"
          >
            <IoClose size={28} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        {/* Interactive Content Area */}
        <div className="w-full h-full cursor-pointer select-none" onClick={handleTap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="relative w-full h-full"
            >
              {/* Background Visual */}
              <motion.div 
                className="absolute inset-0"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6, ease: "linear" }}
              >
                <img 
                  src={currentPage.image_url} 
                  alt={currentPage.title} 
                  className="w-full h-full object-cover"
                />
                {/* Advanced Gradient Mapping */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
              </motion.div>

              {/* Textual Narrative - Arranged for maximum legibility */}
              <div className="absolute inset-x-0 bottom-0 p-8 pb-14 bg-gradient-to-t from-black via-black/80 to-transparent">
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Chapter {currentIndex + 1}</span>
                       <div className="h-px w-10 bg-primary-500/30" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-white font-heading uppercase drop-shadow-2xl">
                      {currentPage.title}
                    </h2>
                  </div>
                  
                  <p className="text-lg text-neutral-200 font-medium leading-relaxed drop-shadow-lg opacity-90">
                    {currentPage.text}
                  </p>

                  <div className="pt-4 flex items-center justify-between opacity-30">
                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">Explore Next</span>
                    <div className="flex gap-1">
                       {[0, 1, 2].map(i => (
                         <motion.div 
                           key={i}
                           animate={{ opacity: [0.2, 1, 0.2] }}
                           transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                           className="w-1 h-1 bg-white rounded-full" 
                         />
                       ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Advanced Navigation Controls */}
        <div className="hidden lg:block">
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-[-120px] top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center text-white/20 hover:text-white hover:scale-125 transition-all group"
          >
            <IoChevronBack size={56} className="group-active:-translate-x-2 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-[-120px] top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center text-white/20 hover:text-white hover:scale-125 transition-all group"
          >
            <IoChevronForward size={56} className="group-active:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
};

export default WebStoryViewer;
