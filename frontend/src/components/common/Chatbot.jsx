import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiX, HiOutlinePaperAirplane, HiOutlineTrash } from 'react-icons/hi';
import { aiChat } from '../../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am BlogVerse AI, powered by Gemini. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking the floating button itself
      const button = document.getElementById('chatbot-toggle-btn');
      if (chatRef.current && !chatRef.current.contains(event.target) && !button?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiChat(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Oops! I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatAndClose = () => {
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?' }]);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        id="chatbot-toggle-btn"
        className="fixed bottom-8 right-8 w-16 h-16 glassium text-primary-500 rounded-[1.5rem] shadow-2xl z-50 flex items-center justify-center glint-border hover:scale-110 active:scale-95 transition-all"
        whileHover={{ y: -5 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <HiX className="w-8 h-8" /> : <HiOutlineChatAlt2 className="w-8 h-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white dark:border-surface-900 animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            ref={chatRef}
            className="fixed bottom-28 right-6 w-[calc(100vw-3rem)] sm:w-[400px] glassium-card glint-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-50 flex flex-col overflow-hidden"
            style={{ height: '600px', maxHeight: 'calc(100vh - 160px)' }}
          >
            {/* Header */}
            <div className="bg-primary-600 dark:bg-primary-500 p-5 flex items-center justify-between shadow-lg shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner backdrop-blur-md">
                  <HiOutlineChatAlt2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-wider">Verse Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    <span className="text-[10px] font-black text-primary-100 uppercase tracking-widest">Gemini Active</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChatAndClose} title="Clear & Close" className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white rounded-xl transition-all group">
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all sm:hidden">
                  <HiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-surface-50 dark:bg-surface-950/50 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm font-bold leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm shadow-primary-600/20'
                        : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-sm border border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-surface-800 rounded-[1.5rem] rounded-bl-sm px-5 py-4 shadow-sm flex gap-1.5 items-center border border-surface-200 dark:border-surface-700">
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Verse AI anything..."
                  className="flex-1 px-6 py-4 bg-surface-100 dark:bg-surface-800 rounded-2xl text-sm font-bold text-surface-900 dark:text-white outline-none placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/20 disabled:opacity-50 transition-all shrink-0"
                >
                  <HiOutlinePaperAirplane className="w-6 h-6 rotate-90" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
