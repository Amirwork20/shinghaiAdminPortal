import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const LandingImagesContext = createContext();

export const useLandingImages = () => useContext(LandingImagesContext);

export const LandingImagesProvider = ({ children }) => {
  const [landingImages, setLandingImages] = useState([]);
  const [landingMedia, setLandingMedia] = useState([]);
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
      
      // Set both arrays for backward compatibility and new feature support
      setLandingImages(response.data.images || []);
      setLandingMedia(response.data.media || response.data.images?.map(url => ({ url, type: 'image' })) || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveLandingImages = async (media) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      // Support for both new media format and legacy images format
      const dataToSend = Array.isArray(media) && media.length > 0 && typeof media[0] === 'object' 
        ? { media } 
        : { images: media };
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/landing-images/add`,
        dataToSend,
        { headers }
      );
      
      // Update state with response data
      setLandingImages(response.data.images || []);
      setLandingMedia(response.data.media || []);
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
    landingMedia,
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