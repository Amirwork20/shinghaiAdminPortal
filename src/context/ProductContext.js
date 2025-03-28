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
  const [searchResults, setSearchResults] = useState(null);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Add retries and timeout to make the request more resilient
      const fetchWithRetry = async (url, options, retries = 3) => {
        try {
          const response = await axios.get(url, {
            ...options,
            timeout: 10000 // 10 second timeout
          });
          return response;
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying fetch for ${url}, ${retries} retries left`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return fetchWithRetry(url, options, retries - 1);
          }
          throw error;
        }
      };
      
      const [activeResponse, nonActiveResponse] = await Promise.all([
        fetchWithRetry(`${API_URL}/products/active`, { headers }),
        fetchWithRetry(`${API_URL}/products/deactivated/all`, { headers })
      ]);
      
      if (activeResponse.data) {
        setProducts(activeResponse.data);
      }
      
      if (nonActiveResponse.data) {
        setNonActiveProducts(nonActiveResponse.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Error message for debugging
      const errorMessage = error.response?.data?.message || error.message || String(error);
      console.error('Error details:', errorMessage);
      
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
      
      // Ensure size_guide_id is properly formatted
      const formattedProductData = {
        ...productData,
        size_guide_id: productData.size_guide_id || null
      };
      
      // Log the productData for debugging
      console.log('Updating product with data:', {
        id,
        size_guide_id: formattedProductData.size_guide_id,
        fabric_id: formattedProductData.fabric_id
      });
      
      const response = await axios.put(`${API_URL}/products/${id}`, formattedProductData, { headers });
      
      // Update the products list with the new data
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
      if (!imageUrl) {
        console.error('Invalid imageUrl provided to deleteImage');
        return false;
      }

      // Extract the key from the image URL
      let key = imageUrl;
      
      // If it's a full URL, extract the path portion
      if (imageUrl.includes('amazonaws.com')) {
        // Extract everything after the bucket name in S3 URL
        const matches = imageUrl.match(/amazonaws\.com\/(.+)$/);
        if (matches && matches[1]) {
          key = matches[1];
        }
      } else if (imageUrl.includes('/')) {
        // Handle paths with slashes but not full URLs
        // If it already has 'images/' prefix, keep it
        if (imageUrl.includes('images/')) {
          const parts = imageUrl.split('images/');
          key = parts.length > 1 ? `images/${parts[1]}` : imageUrl;
        } else {
          // Just get the filename as a fallback
          const urlParts = imageUrl.split('/');
          key = urlParts[urlParts.length - 1];
        }
      }
      
      console.log('Deleting image with key:', key);
      
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/products/delete-image/${encodeURIComponent(key)}`, { headers });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoUrl) => {
    try {
      if (!videoUrl) {
        console.error('Invalid videoUrl provided to deleteVideo');
        return false;
      }

      // Extract the key from the video URL
      let key = videoUrl;
      
      // If it's a full URL, extract the path portion
      if (videoUrl.includes('amazonaws.com')) {
        // Extract everything after the bucket name in S3 URL
        const matches = videoUrl.match(/amazonaws\.com\/(.+)$/);
        if (matches && matches[1]) {
          key = matches[1];
        }
      } else if (videoUrl.includes('/')) {
        // Handle paths with slashes but not full URLs
        // If it already has 'videos/' prefix, keep it
        if (videoUrl.includes('videos/')) {
          const parts = videoUrl.split('videos/');
          key = parts.length > 1 ? `videos/${parts[1]}` : videoUrl;
        } else {
          // Just get the filename as a fallback
          const urlParts = videoUrl.split('/');
          key = urlParts[urlParts.length - 1];
        }
      }
      
      console.log('Deleting video with key:', key);
      
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/products/delete-video/${encodeURIComponent(key)}`, { headers });
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const searchProducts = async (query, column = 'all') => {
    // Check if this is the same search as the last one
    const searchParamsString = `${query}-${column}`;
    
    if (searchParamsString === lastSearchParams) {
      console.log('Skipping duplicate search with same parameters');
      return searchResults || [];
    }
    
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      // Base URL for products search
      let url = `${API_URL}/products/active`;
      
      // If there's a search query, add it as a query parameter
      if (query) {
        url = `${url}?search=${encodeURIComponent(query)}&column=${encodeURIComponent(column)}`;
      }
      
      console.log(`Searching products with query: ${query}, column: ${column}`);
      
      // For some columns, we want to do client-side searching instead
      const clientSideSearchColumns = ['off_percentage_value', 'status'];
      
      if (clientSideSearchColumns.includes(column)) {
        // For these special columns, get all products and filter client-side
        console.log(`Using client-side filtering for column: ${column}`);
        const response = await axios.get(`${API_URL}/products/active`, { headers });
        const allProducts = response.data;
        
        // Filter the products client-side
        let filtered = allProducts;
        
        // Apply client-side filtering based on column
        switch (column) {
          case 'off_percentage_value':
            // Handle percent search (allow searching for percent values)
            const searchNum = parseFloat(query.replace(/%/g, ''));
            if (!isNaN(searchNum)) {
              filtered = allProducts.filter(product => {
                if (product.off_percentage_value !== undefined && product.off_percentage_value !== null) {
                  return Math.abs(product.off_percentage_value - searchNum) < 0.01;
                }
                
                if (product.actual_price && product.price && product.actual_price > product.price) {
                  const discount = ((product.actual_price - product.price) / product.actual_price) * 100;
                  return Math.abs(discount - searchNum) < 0.01;
                }
                
                return false;
              });
            } else {
              filtered = [];
            }
            break;
            
          case 'status':
            // Status search (active, inactive, deal, hot deal, vat)
            const lowerSearch = query.toLowerCase();
            filtered = allProducts.filter(product => {
              if (lowerSearch.includes('active') && product.is_active) return true;
              if (lowerSearch.includes('inactive') && !product.is_active) return true;
              if (lowerSearch.includes('hot deal') && product.is_hot_deal) return true;
              if (lowerSearch.includes('deal') && product.is_deal) return true;
              if (lowerSearch.includes('vat') && product.vat_included) return true;
              return false;
            });
            break;
            
          default:
            // No special filtering needed
            break;
        }
        
        setSearchResults(filtered);
        setLastSearchParams(searchParamsString);
        setIsLoading(false);
        return filtered;
      } else {
        // Use server-side search for other columns
        const response = await axios.get(url, { headers });
        
        // Store the search results separately from the main products list
        setSearchResults(response.data);
        // Save the search parameters to avoid duplicate searches
        setLastSearchParams(searchParamsString);
        setIsLoading(false);
        return response.data;
      }
    } catch (error) {
      console.error('Error searching products:', error.response?.data || error.message || error);
      // Don't change search results on error, keep previous results
      if (error.response?.status === 400) {
        // If it's a 400 error, it's likely a validation error, so we should clear the results
        setSearchResults([]);
        setIsLoading(false);
        return [];
      } else {
        // For other errors, keep the previous results
        console.log('Keeping previous search results due to API error');
        setIsLoading(false);
        return searchResults || [];
      }
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setLastSearchParams(null);
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
    deleteVideo,
    searchProducts,
    searchResults,
    clearSearch
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
