import axios from 'axios';

const API_URL = 'http://localhost:5001/api/rooms';

const roomService = {
  createRoom: (token) => {
    return axios.post(`${API_URL}/create`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  joinRoom: (code, token) => {
    return axios.post(`${API_URL}/join`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getRoomDetails: (code, token) => {
    return axios.get(`${API_URL}/${code}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getUserRooms: (token) => {
    return axios.get(`${API_URL}/user/my-rooms`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export default roomService;
