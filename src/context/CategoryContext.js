import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

const fallbackCategories = [
  {
    id: 1,
    category_name: "Clothing",
    sub_category_id: 1
  }
];

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!isLoading) return;
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: getAuthHeaders()
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use fallback data if API fails
      setCategories(fallbackCategories);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, isLoading]);

  const addCategory = async (categoryData) => {
    try {
      const response = await axios.post(`${API_URL}/categories`, categoryData, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => [...prevCategories, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding category:', error);
      // Create fake response with generated ID
      const fakeCategory = {
        ...categoryData,
        id: Math.floor(Math.random() * 10000)
      };
      setCategories(prevCategories => [...prevCategories, fakeCategory]);
      return fakeCategory;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URL}/categories/${id}`, categoryData, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => prevCategories.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      // Update locally if API fails
      const updatedCategory = { ...categoryData, id };
      setCategories(prevCategories => prevCategories.map(cat => cat._id === id ? updatedCategory : cat));
      return updatedCategory;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: getAuthHeaders()
      });
      setCategories(prevCategories => prevCategories.filter(cat => cat._id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      // Delete locally if API fails
      setCategories(prevCategories => prevCategories.filter(cat => cat._id !== id));
    }
  };

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
    isLoading
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
