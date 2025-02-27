import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const BrandContext = createContext({
  brands: [],
  addBrand: () => {},
  updateBrand: () => {},
  deleteBrand: () => {},
  fetchBrands: () => {}
});

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

const fallbackBrands = [
  {
    id: 1,
    brand_name: "Nike",
    category_id: 1
  },
  {
    id: 2,
    brand_name: "Adidas",
    category_id: 1
  },
  {
    id: 3,
    brand_name: "Puma",
    category_id: 1
  }
];

export const BrandProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchBrands = useCallback(async () => {
    if (!isLoading) return;
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/brands`, { headers });
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error.response || error);
      setBrands(fallbackBrands);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, isLoading]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const addBrand = async (brandData) => {
    try {
      const response = await axios.post(`${API_URL}/brands`, brandData, {
        headers: getAuthHeaders()
      });
      setBrands(prevBrands => [...prevBrands, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding brand:', error);
      const fakeBrand = {
        ...brandData,
        id: Math.floor(Math.random() * 10000)
      };
      setBrands(prevBrands => [...prevBrands, fakeBrand]);
      return fakeBrand;
    }
  };

  const updateBrand = async (id, brandData) => {
    try {
      const response = await axios.put(`${API_URL}/brands/${id}`, brandData, {
        headers: getAuthHeaders()
      });
      setBrands(prevBrands => prevBrands.map(brand => brand._id === id ? response.data : brand));
      return response.data;
    } catch (error) {
      console.error('Error updating brand:', error);
      const updatedBrand = { ...brandData, id };
      setBrands(prevBrands => prevBrands.map(brand => brand._id === id ? updatedBrand : brand));
      return updatedBrand;
    }
  };

  const deleteBrand = async (id) => {
    try {
      await axios.delete(`${API_URL}/brands/${id}`, {
        headers: getAuthHeaders()
      });
      setBrands(prevBrands => prevBrands.filter(brand => brand._id !== id));
    } catch (error) {
      console.error('Error deleting brand:', error);
      setBrands(prevBrands => prevBrands.filter(brand => brand._id !== id));
    }
  };

  const value = {
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    fetchBrands,
    isLoading
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
