import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const LandingImagesContext = createContext();

export const useLandingImages = () => useContext(LandingImagesContext);

export const LandingImagesProvider = ({ children }) => {
  const [landingImages, setLandingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = Cookies.get('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchLandingImages = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/landing-images`,
        { headers }
      );
      setLandingImages(response.data.images || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveLandingImages = async (images) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/landing-images/add`,
        { images },
        { headers }
      );
      setLandingImages(response.data.images);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    landingImages,
    loading,
    error,
    fetchLandingImages,
    saveLandingImages
  };

  return (
    <LandingImagesContext.Provider value={value}>
      {children}
    </LandingImagesContext.Provider>
  );
}; 