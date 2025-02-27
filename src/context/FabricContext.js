import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const FabricContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const FabricProvider = ({ children }) => {
  const [fabrics, setFabrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchFabrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/fabrics/all`, { headers });
      setFabrics(response.data);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
      setFabrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addFabric = async (fabricData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(`${API_URL}/fabrics`, fabricData, { headers });
      setFabrics(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding fabric:', error);
      throw error;
    }
  };

  const updateFabric = async (id, fabricData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/fabrics/${id}`, fabricData, { headers });
      setFabrics(prev => prev.map(fabric => 
        fabric._id === id ? response.data : fabric
      ));
      return response.data;
    } catch (error) {
      console.error('Error updating fabric:', error);
      throw error;
    }
  };

  const deactivateFabric = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/fabrics/deactivate/${id}`, {}, { headers });
      setFabrics(prev => prev.map(fabric => 
        fabric._id === id ? { ...fabric, is_active: false } : fabric
      ));
    } catch (error) {
      console.error('Error deactivating fabric:', error);
      throw error;
    }
  };

  const activateFabric = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/fabrics/activate/${id}`, {}, { headers });
      setFabrics(prev => prev.map(fabric => 
        fabric._id === id ? { ...fabric, is_active: true } : fabric
      ));
    } catch (error) {
      console.error('Error activating fabric:', error);
      throw error;
    }
  };

  const value = {
    fabrics,
    isLoading,
    fetchFabrics,
    addFabric,
    updateFabric,
    deactivateFabric,
    activateFabric
  };

  return (
    <FabricContext.Provider value={value}>
      {children}
    </FabricContext.Provider>
  );
};

export const useFabric = () => {
  const context = useContext(FabricContext);
  if (context === undefined) {
    throw new Error('useFabric must be used within a FabricProvider');
  }
  return context;
}; 