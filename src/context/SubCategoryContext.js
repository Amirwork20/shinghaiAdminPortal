import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const SubCategoryContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const SubCategoryProvider = ({ children }) => {
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSubCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/sub-categories`, {
        headers: getAuthHeaders()
      });
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Error fetching sub categories');
      setSubCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addSubCategory = async (categoryData) => {
    setError(null);
    try {
      // Extract imageUrl from the image object if it's not a string
      const formattedData = {
        ...categoryData,
        image_url: typeof categoryData.image_url === 'object' 
          ? categoryData.image_url.imageUrl || categoryData.image_url.toString() 
          : categoryData.image_url
      };
      
      const response = await axios.post(`${API_URL}/sub-categories`, formattedData, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error adding sub category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateSubCategory = async (id, categoryData) => {
    setError(null);
    try {
      // Extract imageUrl from the image object if it's not a string
      const formattedData = {
        ...categoryData,
        image_url: typeof categoryData.image_url === 'object' 
          ? categoryData.image_url.imageUrl || categoryData.image_url.toString() 
          : categoryData.image_url
      };
      
      const response = await axios.put(`${API_URL}/sub-categories/${id}`, formattedData, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => prev.map(cat => cat._id === id ? response.data : cat));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error updating sub category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteSubCategory = async (id) => {
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/sub-categories/${id}`, {
        headers: getAuthHeaders()
      });
      setSubCategories(prev => prev.filter(cat => cat._id !== id));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error deleting sub category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    subCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    fetchSubCategories,
    isLoading,
    error
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