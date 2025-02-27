import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const NavMenuContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const NavMenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/nav-menu`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      setMenuItems(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch menu items');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addMenuItem = useCallback(async (menuData) => {
    try {
      const response = await axios.post(`${API_URL}/nav-menu`, menuData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      // Update local state immediately
      setMenuItems(prevItems => ({
        ...prevItems,
        [menuData.section]: response.data
      }));
      
      return response.data;
    } catch (error) {
      console.error('Add menu item error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add menu item');
    }
  }, [getAuthHeaders]);

  const updateMenuItem = useCallback(async (id, menuData) => {
    try {
      const response = await axios.put(`${API_URL}/nav-menu/${id}`, menuData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      await fetchMenuItems();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update menu item');
    }
  }, [getAuthHeaders, fetchMenuItems]);

  const deleteMenuItem = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/nav-menu/${id}`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      await fetchMenuItems();
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete menu item');
    }
  }, [getAuthHeaders, fetchMenuItems]);

  const value = {
    menuItems,
    isLoading,
    error,
    fetchMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
  };

  return (
    <NavMenuContext.Provider value={value}>
      {children}
    </NavMenuContext.Provider>
  );
};

export const useNavMenu = () => {
  const context = useContext(NavMenuContext);
  if (context === undefined) {
    throw new Error('useNavMenu must be used within a NavMenuProvider');
  }
  return context;
}; 