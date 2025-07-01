import { api } from './baseApi.js';

export const authAPI = {
  login: async (credentials) => {
    const response = await api.get(
      `/users?username=eq.${credentials.username}&password=eq.${credentials.password}&select=*`
    );
    
    if (response.data.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    return response.data[0];
  },

  register: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data[0];
  },

  updateProfile: async (userId, userData) => {
    const response = await api.patch(`/users?id=eq.${userId}`, userData);
    return response.data[0];
  }
};
