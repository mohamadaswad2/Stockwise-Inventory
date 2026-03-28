import api from './api';

export const register           = (data)          => api.post('/auth/register', data);
export const verifyEmail        = (email, code)   => api.post('/auth/verify-email', { email, code });
export const resendVerification = (email)          => api.post('/auth/resend-verification', { email });
export const login              = (data)           => api.post('/auth/login', data);
export const logout             = ()               => api.post('/auth/logout');
export const getProfile         = ()               => api.get('/auth/profile');
export const changePassword     = (data)           => api.post('/auth/change-password', data);
export const forgotPassword     = (email)          => api.post('/auth/forgot-password', { email });
export const resetPassword      = (data)           => api.post('/auth/reset-password', data);
