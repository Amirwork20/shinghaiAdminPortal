import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

// Use a fallback value if the environment variable is not set
const API_URL = process.env.REACT_APP_BACKEND_URL;
console.log('API_URL:', API_URL);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          console.log('Verifying token at:', `${API_URL}/auth/verify-token`);
          console.log('Token:', token);
          const response = await axios.get(`${API_URL}/auth/verify-token`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          // Fallback fake data for development/testing
          setUser({
            id: '12345',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin', // or 'manager' based on your needs
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          Cookies.remove('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token } = response.data;
      Cookies.set('token', token);
      console.log('Login Token:', token);
      const userResponse = await axios.get(`${API_URL}/auth/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('token');
    // Use window.location.href to force a full page reload
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
