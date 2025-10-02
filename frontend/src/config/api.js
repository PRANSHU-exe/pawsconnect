// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google`,
  APPLE_AUTH: `${API_BASE_URL}/api/auth/apple`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  
  // Chat/AI
  PAWSBOT: `${API_BASE_URL}/api/chat/pawsbot`,
  EMERGENCY_CHECK: `${API_BASE_URL}/api/chat/emergency-check`,
  SUMMARIZE_ANSWERS: `${API_BASE_URL}/api/chat/summarize-answers`,
  
  // Posts
  POSTS: `${API_BASE_URL}/api/posts`,
  POST_BY_ID: (id) => `${API_BASE_URL}/api/posts/${id}`,
  POST_LIKE: (id) => `${API_BASE_URL}/api/posts/${id}/like`,
  POST_SAVE: (id) => `${API_BASE_URL}/api/posts/${id}/save`,
  
  // Comments
  COMMENTS: `${API_BASE_URL}/api/comments`,
  COMMENT_BY_ID: (id) => `${API_BASE_URL}/api/comments/${id}`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_USERNAME: (username) => `${API_BASE_URL}/api/users/profile/${username}`,
  USER_POSTS: (userId) => `${API_BASE_URL}/api/users/${userId}/posts`,
  USER_FOLLOW: (userId) => `${API_BASE_URL}/api/users/follow/${userId}`,
  USER_FOLLOWERS: (userId) => `${API_BASE_URL}/api/users/${userId}/followers`,
  USER_FOLLOWING: (userId) => `${API_BASE_URL}/api/users/${userId}/following`,
  
  // Pets
  PETS: `${API_BASE_URL}/api/pets`,
  PET_BY_ID: (id) => `${API_BASE_URL}/api/pets/${id}`,
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for API calls
export const apiCall = async (url, options = {}) => {
  const defaultOptions = {
    headers: getAuthHeaders(),
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

export default API_BASE_URL;
