import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const CategoryContext = createContext({
  categories: [],
  addCategory: () => {},
  updateCategory: () => {},
  deleteCategory: () => {},
  fetchCategories: () => {}
});

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: getAuthHeaders()
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Error fetching categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addCategory = async (categoryData) => {
    setError(null);
    try {
      // Extract imageUrl from the image object if it's not a string
      const formattedData = {
        ...categoryData,
        image_url: typeof categoryData.image_url === 'object' 
          ? categoryData.image_url.imageUrl || categoryData.image_url.toString() 
          : categoryData.image_url
      };
      
      const response = await axios.post(`${API_URL}/categories`, formattedData, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => [...prevCategories, response.data]);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error adding category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCategory = async (id, categoryData) => {
    setError(null);
    try {
      // Extract imageUrl from the image object if it's not a string
      const formattedData = {
        ...categoryData,
        image_url: typeof categoryData.image_url === 'object' 
          ? categoryData.image_url.imageUrl || categoryData.image_url.toString() 
          : categoryData.image_url
      };
      
      const response = await axios.put(`${API_URL}/categories/${id}`, formattedData, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => prevCategories.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error updating category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCategory = async (id) => {
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/categories/${id}`, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => prevCategories.filter(cat => cat._id !== id));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error deleting category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
    isLoading,
    error
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};
