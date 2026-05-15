import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5';

const WebStoryViewer = ({ story, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const pages = story?.pages || [];
  const duration = 5000; // 5 seconds per slide
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Story Container */}
      <div className="relative w-full h-full max-w-[450px] md:h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl bg-neutral-900">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
          {pages.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-50 ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium drop-shadow-md">{story.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <IoClose size={24} />
          </button>
        </div>

        {/* Content Area (Tap-able) */}
        <div className="w-full h-full cursor-pointer" onClick={handleTap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={currentPage.image_url} 
                  alt={currentPage.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              </div>

              {/* Text Content */}
              <div className="absolute bottom-12 left-6 right-6 text-white space-y-3">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold leading-tight"
                >
                  {currentPage.title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-white/90"
                >
                  {currentPage.text}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden md:block">
          <button 
            onClick={prevSlide}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors"
          >
            <IoChevronBack size={40} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors"
          >
            <IoChevronForward size={40} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default WebStoryViewer;
