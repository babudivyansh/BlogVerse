import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineMailOpen } from 'react-icons/hi';
import api from '../services/api';
import SEO from '../components/common/SEO';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed. The link may be expired or invalid.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <SEO title="Verify Email" description="Verify your BlogVerse account to start sharing your technology stories." />
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="glass-card rounded-3xl p-10 shadow-2xl shadow-primary-500/5">
          {status === 'verifying' && (
            <div className="space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Verifying Email</h2>
                <p className="text-surface-500 dark:text-surface-400">Please wait while we confirm your account...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                <HiOutlineCheckCircle />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Verification Successful!</h2>
                <p className="text-surface-500 dark:text-surface-400">{message}</p>
              </div>
              <Link 
                to="/auth?tab=login"
                className="inline-block w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                <HiOutlineExclamationCircle />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Verification Failed</h2>
                <p className="text-surface-500 dark:text-surface-400">{message}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link 
                  to="/auth?tab=signup"
                  className="w-full py-3 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-all text-sm"
                >
                  Back to Sign Up
                </Link>
                <Link to="/" className="text-sm text-primary-500 hover:underline">Return to Home</Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
