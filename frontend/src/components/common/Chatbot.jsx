import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiX, HiOutlinePaperAirplane, HiOutlineTrash } from 'react-icons/hi';
import { aiChat } from '../../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am BlogVerse AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?' }]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 p-4 bg-primary-600 text-white rounded-full shadow-2xl hover:shadow-primary-500/50 hover:bg-primary-700 transition-all z-50 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <HiX className="w-6 h-6" /> : <HiOutlineChatAlt2 className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <HiOutlineChatAlt2 className="w-5 h-5" />
                <h3 className="font-semibold">BlogVerse Assistant</h3>
              </div>
              <button onClick={clearChat} title="Clear Chat" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-surface-50 dark:bg-surface-950">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-surface-400 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-surface-400 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-surface-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-surface-900 rounded-xl text-sm text-surface-900 dark:text-white outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
