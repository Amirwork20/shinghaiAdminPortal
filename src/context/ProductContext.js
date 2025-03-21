import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const ProductContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

const fallbackProducts = [
  {
    id: 1,
    title: "Nike Air Max",
    description: "Premium running shoes",
    price: 199.99,
    actual_price: 249.99,
    off_percentage_value: 20,
    quantity: 50,
    max_quantity_per_user: 2,
    image_url: "https://example.com/nike-air-max.jpg",
    tabs_image_url: [
      "https://example.com/nike-1.jpg",
      "https://example.com/nike-2.jpg"
    ],
    is_deal: true,
    is_hot_deal: false,
    vat_included: true,
    attributes: [
      {
        attribute_id: 1,
        values: ["41", "42", "43"]
      },
      {
        attribute_id: 2,
        values: ["Black", "White"]
      }
    ],
    care_instructions: "Hand wash only",
    disclaimer: "Results may vary"
  },
  // Add more fallback products as needed
];

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [nonActiveProducts, setNonActiveProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const [activeResponse, nonActiveResponse] = await Promise.all([
        axios.get(`${API_URL}/products/active`, { headers }),
        axios.get(`${API_URL}/products/deactivated/all`, { headers })
      ]);
      setProducts(activeResponse.data);
      setNonActiveProducts(nonActiveResponse.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Use fallback data if API fails
      setProducts(fallbackProducts);
      setNonActiveProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addProduct = async (productData) => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };
      
      // Log the data being sent
      console.log('Sending product data:', productData);

      const response = await axios.post(
        `${API_URL}/products`, 
        productData,
        { headers }
      );
      
      setProducts(prevProducts => [...prevProducts, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error.response?.data || error);
      throw error;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/products/${id}`, productData, { headers });
      setProducts(prevProducts => prevProducts.map(product => 
        product._id === id ? response.data : product
      ));
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      // Update locally if API fails
      const updatedProduct = { ...productData, id };
      setProducts(prevProducts => prevProducts.map(product => 
        product._id === id ? updatedProduct : product
      ));
      return updatedProduct;
    }
  };

  const createFormData = (productData) => {
    const formData = new FormData();

    Object.keys(productData).forEach(key => {
      if (key === 'attributes') {
        formData.append(key, JSON.stringify(productData[key]));
      } else if (key === 'mainImage' && productData[key]) {
        formData.append('mainImage', productData[key]);
      } else if (key === 'tabImages' && productData[key] && productData[key].length > 0) {
        productData[key].forEach((file, index) => {
          if (file instanceof File) {
            formData.append(`tabImages`, file);
          }
        });
      } else if (key === 'tabs_image_url' && productData[key] && productData[key].length > 0) {
        formData.append('tabs_image_url', JSON.stringify(productData[key]));
      } else {
        formData.append(key, productData[key]);
      }
    });

    return formData;
  };

  const deleteProduct = async (id) => {
    try {
      // Get the product details first to access image URLs
      const headers = getAuthHeaders();
      const productToDelete = await axios.get(`${API_URL}/products/${id}`, { headers })
        .then(response => response.data)
        .catch(error => {
          console.error('Error fetching product for deletion:', error);
          return null;
        });
      
      // Deactivate the product
      await axios.put(`${API_URL}/products/deactivate/${id}`, null, { headers });
      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      
      // Delete associated images if product was found
      if (productToDelete) {
        // Delete main image
        if (productToDelete.image_url) {
          deleteImage(productToDelete.image_url).catch(err => {
            console.error('Failed to delete main product image:', err);
          });
        }
        
        // Delete tab images
        if (productToDelete.tabs_image_url && Array.isArray(productToDelete.tabs_image_url)) {
          for (const imageUrl of productToDelete.tabs_image_url) {
            deleteImage(imageUrl).catch(err => {
              console.error(`Failed to delete tab image ${imageUrl}:`, err);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      // Delete locally if API fails
      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
    }
  };

  const getProductById = useCallback(async (id) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/products/${id}`, { headers });
      setSelectedProduct(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      // Return fallback product if API fails
      const fallbackProduct = fallbackProducts.find(p => p._id === parseInt(id)) || {
        ...fallbackProducts[0],
        id: parseInt(id)
      };
      setSelectedProduct(fallbackProduct);
      return fallbackProduct;
    }
  }, [getAuthHeaders]);

  const reactivateProduct = async (id) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_URL}/products/activate/${id}`, null, { headers });
      
      // Update the products and nonActiveProducts states immediately
      setProducts(prevProducts => [...prevProducts, response.data]);
      setNonActiveProducts(prevNonActive => prevNonActive.filter(product => product._id !== id));
      
      return response.data;
    } catch (error) {
      console.error('Error reactivating product:', error);
      throw error;
    }
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = Cookies.get('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/products/upload-image`,
        formData,
        { headers }
      );
      
      console.log('Image upload response:', response.data);
      
      // Return the full response data with all metadata
      if (response.data.imageUrl) {
        // For compatibility with both new and old code using this function
        const result = response.data;
        // Add the URL directly on the result object for backward compatibility
        Object.defineProperty(result, 'toString', {
          value: function() { return this.imageUrl; },
          writable: true,
          configurable: true
        });
        return result;
      }
      
      throw new Error('Image URL not found in response');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const uploadVideo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const token = Cookies.get('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/products/upload-video`,
        formData,
        { headers }
      );
      
      console.log('Video upload response:', response.data);
      
      // Return the full response data with all metadata
      if (response.data.videoUrl) {
        // For compatibility with both new and old code using this function
        const result = response.data;
        // Add the URL directly on the result object for backward compatibility
        Object.defineProperty(result, 'toString', {
          value: function() { return this.videoUrl; },
          writable: true,
          configurable: true
        });
        return result;
      }
      
      throw new Error('Video URL not found in response');
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  };

  const deleteImage = async (imageUrl) => {
    try {
      // Extract the key from the image URL
      let key = imageUrl;
      
      // If it's a full URL, extract just the filename/path portion
      if (imageUrl && imageUrl.includes('/')) {
        // Handle full URL paths (could be multiple formats)
        if (imageUrl.includes('amazonaws.com')) {
          // Extract everything after the bucket name in S3 URL
          const matches = imageUrl.match(/amazonaws\.com\/(.+)$/);
          if (matches && matches[1]) {
            key = matches[1];
          } else {
            const urlParts = imageUrl.split('/');
            key = urlParts[urlParts.length - 1];
          }
        } else {
          // Simple path - just get the filename
          const urlParts = imageUrl.split('/');
          key = urlParts[urlParts.length - 1];
        }
      }
      
      console.log('Deleting image with key:', key);
      
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/products/delete-image/${key}`, { headers });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoUrl) => {
    try {
      // Extract the key from the video URL
      let key = videoUrl;
      
      // If it's a full URL, extract just the filename/path portion
      if (videoUrl && videoUrl.includes('/')) {
        // Handle full URL paths (could be multiple formats)
        if (videoUrl.includes('amazonaws.com')) {
          // Extract everything after the bucket name in S3 URL
          const matches = videoUrl.match(/amazonaws\.com\/(.+)$/);
          if (matches && matches[1]) {
            key = matches[1];
          } else {
            const urlParts = videoUrl.split('/');
            key = urlParts[urlParts.length - 1];
          }
        } else {
          // Simple path - just get the filename
          const urlParts = videoUrl.split('/');
          key = urlParts[urlParts.length - 1];
        }
      }
      
      console.log('Deleting video with key:', key);
      
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/products/delete-video/${key}`, { headers });
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products,
    nonActiveProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,
    fetchProducts,
    isLoading,
    getProductById,
    selectedProduct,
    setSelectedProduct,
    uploadImage,
    uploadVideo,
    deleteImage,
    deleteVideo
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
