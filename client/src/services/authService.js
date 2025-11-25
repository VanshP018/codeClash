import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';

const authService = {
  signup: (username, email, password) => {
    return axios.post(`${API_URL}/signup`, {
      username,
      email,
      password
    });
  },

  login: (email, password) => {
    return axios.post(`${API_URL}/login`, {
      email,
      password
    });
  },

  getCurrentUser: (token) => {
    return axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;
