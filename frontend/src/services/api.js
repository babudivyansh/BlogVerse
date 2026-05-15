import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';
// Fix for Render host variable missing the protocol and public domain
if (baseURL && !baseURL.startsWith('http') && !baseURL.startsWith('/')) {
  if (!baseURL.includes('.')) {
    baseURL = `${baseURL}.onrender.com`;
  }
  baseURL = `https://${baseURL}/api`;
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to format image URLs (Cloudinary vs Local)
export const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  // For local uploads, prepend the server URL
  const serverURL = baseURL.replace('/api', '');
  // Remove duplicate slashes if any
  const cleanBase = serverURL.endsWith('/') ? serverURL.slice(0, -1) : serverURL;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanPath}`;
};

// Attach token from localStorage on init
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ── Blog APIs ──────────────────────────────────────────────────
export const getBlogs = (params) => api.get('/blogs', { params });
export const getFeaturedBlogs = () => api.get('/blogs/featured');
export const getBlog = (slug) => api.get(`/blogs/${slug}`);
export const createBlog = (data) => api.post('/blogs', data);
export const updateBlog = (id, data) => api.put(`/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/blogs/${id}`);
export const toggleLike = (id) => api.post(`/blogs/${id}/like`);
export const getCategories = () => api.get('/blogs/categories');
export const getTags = () => api.get('/blogs/tags');

// ── Web Story APIs ─────────────────────────────────────────────
export const getStories = (params) => api.get('/stories', { params });
export const getMyStories = () => api.get('/stories/me');
export const getStory = (slug) => api.get(`/stories/${slug}`);
export const getStoryById = (id) => api.get(`/stories/id/${id}`);
export const generateStory = (blogId) => api.post(`/stories/generate/${blogId}`);
export const suggestStoryContent = (blogId) => api.post(`/stories/suggest/${blogId}`);
export const createStory = (data) => api.post('/stories', data);
export const updateStory = (id, data) => api.put(`/stories/${id}`, data);
export const deleteStory = (id) => api.delete(`/stories/${id}`);

// ── Comment APIs ───────────────────────────────────────────────
export const getComments = (blogId) => api.get(`/blogs/${blogId}/comments`);
export const createComment = (blogId, data) => api.post(`/blogs/${blogId}/comments`, data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// ── User APIs ──────────────────────────────────────────────────
export const getUserProfile = (username) => api.get(`/users/${username}`);
export const updateProfile = (data) => api.put('/users/me', data);
export const getUserBlogs = (username) => api.get(`/users/${username}/blogs`);

// ── Admin APIs ─────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const toggleBlockUser = (id) => api.put(`/admin/users/${id}/block`);
export const getAdminBlogs = (params) => api.get('/admin/blogs', { params });
export const adminDeleteBlog = (id) => api.delete(`/admin/blogs/${id}`);
export const toggleFeatured = (id) => api.put(`/admin/blogs/${id}/feature`);

// Newsletter API
export const subscribeNewsletter = (email) => api.post('/newsletter/subscribe', { email });
export const getSubscribers = () => api.get('/newsletter/subscribers');
export const deleteSubscriber = (id) => api.delete(`/newsletter/subscribers/${id}`);
export const sendNewsletterBroadcast = (blogId) => api.post(`/newsletter/broadcast/${blogId}`);

// ── AI APIs ────────────────────────────────────────────────────
export const aiGenerateTitle = (topic) => api.post('/ai/generate-title', { topic });
export const aiGenerateSummary = (content) => api.post('/ai/generate-summary', { content });
export const aiSuggestTags = (content) => api.post('/ai/suggest-tags', { content });
export const aiImproveContent = (content) => api.post('/ai/improve-content', { content });
export const aiGenerateBlog = (data) => api.post('/ai/generate-blog', data);
export const aiChat = (messages) => api.post('/ai/chat', { messages });
export const aiGenerateCover = (data) => api.post('/ai/generate-image', data);

// ── Upload API ─────────────────────────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
