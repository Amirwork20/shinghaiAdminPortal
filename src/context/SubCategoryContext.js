import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const SubCategoryContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

const fallbackSubCategories = [
  {
    id: 1,
    category_name: "Smartphones",
    main_category_id: 1
  }
];

export const SubCategoryProvider = ({ children }) => {
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSubCategories = useCallback(async () => {
    if (!isLoading) return;
    try {
      const response = await axios.get(`${API_URL}/sub-categories`, {
        headers: getAuthHeaders()
      });
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      setSubCategories(fallbackSubCategories);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, isLoading]);

  const addSubCategory = async (categoryData) => {
    try {
      const response = await axios.post(`${API_URL}/sub-categories`, categoryData, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding sub category:', error);
      const fakeCategory = {
        ...categoryData,
        id: Math.floor(Math.random() * 10000)
      };
      setSubCategories(prev => [...prev, fakeCategory]);
      return fakeCategory;
    }
  };

  const updateSubCategory = async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URL}/sub-categories/${id}`, categoryData, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => prev.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      console.error('Error updating sub category:', error);
      const updatedCategory = { ...categoryData, id };
      setSubCategories(prev => prev.map(cat => cat._id === id ? updatedCategory : cat));
      return updatedCategory;
    }
  };

  const deleteSubCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/sub-categories/${id}`, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => prev.filter(cat => cat._id !== id));
    } catch (error) {
      console.error('Error deleting sub category:', error);
      setSubCategories(prev => prev.filter(cat => cat._id !== id));
    }
  };

  const value = {
    subCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    fetchSubCategories,
    isLoading
  };

  return (
    <SubCategoryContext.Provider value={value}>
      {children}
    </SubCategoryContext.Provider>
  );
};

export const useSubCategory = () => {
  const context = useContext(SubCategoryContext);
  if (context === undefined) {
    throw new Error('useSubCategory must be used within a SubCategoryProvider');
  }
  return context;
}; 