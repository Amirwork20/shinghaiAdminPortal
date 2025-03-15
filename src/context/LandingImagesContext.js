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
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    type: null
  });

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
      
      // Validate media items before sending
      if (dataToSend.media) {
        // Ensure all media items have the correct format
        dataToSend.media = dataToSend.media.map(item => {
          // If it's just a string URL, convert to object
          if (typeof item === 'string') {
            return { url: item, type: 'image' };
          }
          
          // Ensure all video items have required properties
          if (item.type === 'video' && !item.url) {
            console.warn('Invalid video item found:', item);
            return null;
          }
          
          return item;
        }).filter(Boolean); // Remove any null items
      }
      
      console.log('Saving landing media:', dataToSend);
      
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
      console.error('Error saving landing media:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const trackUploadProgress = (type, progress) => {
    setUploadProgress({
      isUploading: progress < 100,
      progress,
      type
    });
  };

  const value = {
    landingImages,
    landingMedia,
    loading,
    error,
    uploadProgress,
    fetchLandingImages,
    saveLandingImages,
    trackUploadProgress
  };

  return (
    <LandingImagesContext.Provider value={value}>
      {children}
    </LandingImagesContext.Provider>
  );
}; 