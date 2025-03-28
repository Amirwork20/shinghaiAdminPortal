import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const SizeGuideContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const SizeGuideProvider = ({ children }) => {
  const [sizeGuides, setSizeGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSizeGuides = useCallback(async (includeInactive = false) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const endpoint = includeInactive ? `${API_URL}/size-guides/admin/all` : `${API_URL}/size-guides/active`;
      
      const response = await axios.get(endpoint, { headers });
      setSizeGuides(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching size guides:', error);
      setError(error.message || 'Failed to fetch size guides');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const getSizeGuideById = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/size-guides/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching size guide:', error);
      setError(error.message || 'Failed to fetch size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const createSizeGuide = async (sizeGuideData) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(`${API_URL}/size-guides`, sizeGuideData, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      setSizeGuides(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating size guide:', error);
      setError(error.message || 'Failed to create size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSizeGuide = async (id, sizeGuideData) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/size-guides/${id}`, sizeGuideData, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      setSizeGuides(prev => prev.map(guide => guide._id === id ? response.data : guide));
      return response.data;
    } catch (error) {
      console.error('Error updating size guide:', error);
      setError(error.message || 'Failed to update size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const activateSizeGuide = async (id) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/size-guides/activate/${id}`, {}, { headers });
      setSizeGuides(prev => prev.map(guide => guide._id === id ? response.data : guide));
      return response.data;
    } catch (error) {
      console.error('Error activating size guide:', error);
      setError(error.message || 'Failed to activate size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateSizeGuide = async (id) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/size-guides/deactivate/${id}`, {}, { headers });
      setSizeGuides(prev => prev.map(guide => guide._id === id ? response.data : guide));
      return response.data;
    } catch (error) {
      console.error('Error deactivating size guide:', error);
      setError(error.message || 'Failed to deactivate size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSizeGuide = async (id) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/size-guides/${id}`, { headers });
      setSizeGuides(prev => prev.filter(guide => guide._id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting size guide:', error);
      setError(error.message || 'Failed to delete size guide');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of size guides
  useEffect(() => {
    fetchSizeGuides();
  }, [fetchSizeGuides]);

  const value = {
    sizeGuides,
    isLoading,
    error,
    fetchSizeGuides,
    getSizeGuideById,
    createSizeGuide,
    updateSizeGuide,
    activateSizeGuide,
    deactivateSizeGuide,
    deleteSizeGuide
  };

  return (
    <SizeGuideContext.Provider value={value}>
      {children}
    </SizeGuideContext.Provider>
  );
};

export const useSizeGuide = () => {
  const context = useContext(SizeGuideContext);
  if (!context) {
    throw new Error('useSizeGuide must be used within a SizeGuideProvider');
  }
  return context;
}; 