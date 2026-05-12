import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
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
import Chatbot from './components/common/Chatbot';
import ThreeBackground from './components/3d/ThreeBackground';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ThreeBackground />
          <div className="min-h-screen text-surface-900 dark:text-white transition-colors">
            <Navbar />
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'text-sm font-medium',
                style: { borderRadius: '12px', padding: '12px 16px' },
              }}
            />
            <main>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create" element={<CreateBlog />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Chatbot />
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
