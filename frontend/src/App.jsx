import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import BlogPost from './pages/BlogPost';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateBlog from './pages/CreateBlog';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Admin from './pages/Admin';
import VerifyEmail from './pages/VerifyEmail';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Terms from './pages/legal/Terms';
import HelpCenter from './pages/legal/HelpCenter';
import ContactUs from './pages/legal/ContactUs';
import Chatbot from './components/common/Chatbot';
import ScrollToTop from './components/common/ScrollToTop';
import StoriesGallery from './pages/StoriesGallery';
import CreateStory from './pages/CreateStory';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col relative transition-colors duration-500">
              {/* Mesh Gradient Background */}
              <div className="mesh-canvas">
                <div className="mesh-blob mesh-blob-1"></div>
                <div className="mesh-blob mesh-blob-2"></div>
                <div className="mesh-blob mesh-blob-3"></div>
              </div>

              <Navbar />
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'text-sm font-bold glassium rounded-2xl border-none shadow-xl',
                  style: { backdropFilter: 'blur(16px)' },
                }}
              />
              <main className="relative z-10 flex-grow">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/stories" element={<StoriesGallery />} />
                    <Route path="/stories/:slug" element={<StoriesGallery />} />
                    <Route path="/create-story" element={<CreateStory />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create" element={<CreateBlog />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/contact" element={<ContactUs />} />
                  </Routes>
                </AnimatePresence>
              </main>
              <Chatbot />
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
