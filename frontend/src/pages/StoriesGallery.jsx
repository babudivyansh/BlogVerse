import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStories, getStory, formatImageUrl } from '../services/api';
import WebStoryViewer from '../components/stories/WebStoryViewer';
import { IoPlayCircle } from 'react-icons/io5';

const StoriesGallery = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    fetchStories();
    if (slug) {
      openStory(slug);
    }
  }, [slug]);

  const fetchStories = async () => {
    try {
      const { data } = await getStories();
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStory = async (slug) => {
    try {
      const { data } = await getStory(slug);
      setSelectedStory(data);
    } catch (error) {
      console.error('Error fetching story details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Web Stories</h1>
          <p className="text-lg text-neutral-600">Visual stories from our latest blog posts.</p>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-200">
          <p className="text-neutral-500">No web stories yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {stories.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openStory(story.slug)}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer shadow-lg group"
            >
              <img 
                src={formatImageUrl(story.cover_image)} 
                alt={story.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <IoPlayCircle className="text-white/80 group-hover:text-white transition-colors mb-2" size={32} />
                <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-md">
                  {story.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedStory && (
          <WebStoryViewer 
            story={selectedStory} 
            onClose={() => {
              setSelectedStory(null);
              if (slug) navigate('/stories');
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesGallery;
