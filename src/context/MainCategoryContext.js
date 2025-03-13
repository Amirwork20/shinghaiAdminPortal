import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const MainCategoryContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const MainCategoryProvider = ({ children }) => {
  const [mainCategories, setMainCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchMainCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/main-categories`, {
        headers: getAuthHeaders()
      });
      setMainCategories(response.data);
    } catch (error) {
      console.error('Error fetching main categories:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Error fetching main categories');
      setMainCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addMainCategory = async (categoryData) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/main-categories`, categoryData, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error adding main category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMainCategory = async (id, categoryData) => {
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/main-categories/${id}`, categoryData, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => prev.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error updating main category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMainCategory = async (id) => {
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/main-categories/${id}`, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => prev.filter(cat => cat._id !== id));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error deleting main category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    mainCategories,
    addMainCategory,
    updateMainCategory,
    deleteMainCategory,
    fetchMainCategories,
    isLoading,
    error
  };

  return (
    <MainCategoryContext.Provider value={value}>
      {children}
    </MainCategoryContext.Provider>
  );
};

export const useMainCategory = () => {
  const context = useContext(MainCategoryContext);
  if (context === undefined) {
    throw new Error('useMainCategory must be used within a MainCategoryProvider');
  }
  return context;
}; 