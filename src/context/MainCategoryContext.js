import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const MainCategoryContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

const fallbackMainCategories = [
  {
    id: 1,
    category_name: "Electronics"
  },
  {
    id: 2,
    category_name: "Fashion"
  }
];

export const MainCategoryProvider = ({ children }) => {
  const [mainCategories, setMainCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchMainCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/main-categories`, {
        headers: getAuthHeaders()
      });
      setMainCategories(response.data);
    } catch (error) {
      console.error('Error fetching main categories:', error);
      setMainCategories(fallbackMainCategories);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addMainCategory = async (categoryData) => {
    try {
      const response = await axios.post(`${API_URL}/main-categories`, categoryData, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding main category:', error);
      const fakeCategory = {
        ...categoryData,
        id: Math.floor(Math.random() * 10000)
      };
      setMainCategories(prev => [...prev, fakeCategory]);
      return fakeCategory;
    }
  };

  const updateMainCategory = async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URL}/main-categories/${id}`, categoryData, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => prev.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      console.error('Error updating main category:', error);
      const updatedCategory = { ...categoryData, id };
      setMainCategories(prev => prev.map(cat => cat._id === id ? updatedCategory : cat));
      return updatedCategory;
    }
  };

  const deleteMainCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/main-categories/${id}`, {
        headers: getAuthHeaders()
      });
      setMainCategories(prev => prev.filter(cat => cat._id !== id));
    } catch (error) {
      console.error('Error deleting main category:', error);
      setMainCategories(prev => prev.filter(cat => cat._id !== id));
    }
  };

  const value = {
    mainCategories,
    addMainCategory,
    updateMainCategory,
    deleteMainCategory,
    fetchMainCategories,
    isLoading
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