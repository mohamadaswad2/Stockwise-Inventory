import api from './api';

export const register          = (data)         => api.post('/auth/register', data);
export const verifyEmail       = (email, code)   => api.post('/auth/verify-email', { email, code });
export const resendVerification= (email)         => api.post('/auth/resend-verification', { email });
export const login = async (data) => {try {const res = await api.post('/auth/login', data);return res.data;} catch (err) {throw err.response?.data || { message: 'Login failed' };}};
export const logout            = ()              => api.post('/auth/logout');
export const getProfile        = ()              => api.get('/auth/profile');
export const changePassword    = (data)          => api.post('/auth/change-password', data);
