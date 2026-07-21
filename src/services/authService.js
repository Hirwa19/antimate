import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export const checkUsername = (username) => {
  return axios.post(`${API_URL}/api/auth/check-username`, { username });
};

export const sendPhoneOtp = (phone) => {
  return axios.post(`${API_URL}/api/auth/send-phone-otp`, { phone });
};

export const verifyPhoneOtp = (phone, otp) => {
  return axios.post(`${API_URL}/api/auth/verify-phone-otp`, { phone, otp });
};

export const registerUser = (userData) => {
  return axios.post(`${API_URL}/api/auth/register`, userData);
};

export const loginUser = (loginData) => {
  return axios.post(`${API_URL}/api/auth/login`, loginData);
};

export const sendForgotPasswordOtp = (data) => {
  return axios.post(`${API_URL}/api/auth/forgot-password/send-otp`, data);
};

export const resetPassword = (data) => {
  return axios.post(`${API_URL}/api/auth/forgot-password/reset`, data);
};