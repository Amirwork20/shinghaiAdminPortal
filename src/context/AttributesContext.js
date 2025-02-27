import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AttributeContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

const fallbackAttributes = [
  {
    id: 1,
    attribute_name: "Color"
  },
  {
    id: 2,
    attribute_name: "Size"
  },
  {
    id: 3,
    attribute_name: "Material"
  }
];

export const AttributeProvider = ({ children }) => {
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchAttributes = useCallback(async () => {
    if (!isLoading) return;
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/attributes`, { headers });
      setAttributes(response.data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setAttributes(fallbackAttributes);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, isLoading]);

  const addAttribute = async (attributeData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(`${API_URL}/attributes`, attributeData, { headers });
      setAttributes(prevAttributes => [...prevAttributes, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding attribute:', error);
      const fakeResponse = {
        ...attributeData,
        id: Math.floor(Math.random() * 10000)
      };
      setAttributes(prevAttributes => [...prevAttributes, fakeResponse]);
      return fakeResponse;
    }
  };

  const updateAttribute = async (id, attributeData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/attributes/${id}`, attributeData, { headers });
      setAttributes(prevAttributes => prevAttributes.map(attr => attr._id === id ? response.data : attr));
      return response.data;
    } catch (error) {
      console.error('Error updating attribute:', error);
      const updatedAttribute = { ...attributeData, id };
      setAttributes(prevAttributes => prevAttributes.map(attr => attr._id === id ? updatedAttribute : attr));
      return updatedAttribute;
    }
  };

  const deleteAttribute = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/attributes/${id}`, { headers });
      setAttributes(prevAttributes => prevAttributes.filter(attr => attr._id !== id));
    } catch (error) {
      console.error('Error deleting attribute:', error);
      setAttributes(prevAttributes => prevAttributes.filter(attr => attr._id !== id));
      throw error;
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const value = {
    attributes,
    addAttribute,
    updateAttribute,
    deleteAttribute,
    fetchAttributes,
    isLoading
  };

  return (
    <AttributeContext.Provider value={value}>
      {children}
    </AttributeContext.Provider>
  );
};

export const useAttribute = () => {
  const context = useContext(AttributeContext);
  if (context === undefined) {
    throw new Error('useAttribute must be used within an AttributeProvider');
  }
  return context;
};
