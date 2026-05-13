import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';
// Fix for Render host variable missing the protocol
if (baseURL && !baseURL.startsWith('http') && !baseURL.startsWith('/')) {
  baseURL = `https://${baseURL}`;
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

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

// ── AI APIs ────────────────────────────────────────────────────
export const aiGenerateTitle = (topic) => api.post('/ai/generate-title', { topic });
export const aiGenerateSummary = (content) => api.post('/ai/generate-summary', { content });
export const aiSuggestTags = (content) => api.post('/ai/suggest-tags', { content });
export const aiImproveContent = (content) => api.post('/ai/improve-content', { content });
export const aiGenerateBlog = (data) => api.post('/ai/generate-blog', data);
export const aiChat = (messages) => api.post('/ai/chat', { messages });

// ── Upload API ─────────────────────────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
