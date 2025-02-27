import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const WebRelatedContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';
export const useWebRelated = () => useContext(WebRelatedContext);

export const WebRelatedProvider = ({ children }) => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [superDeals, setSuperDeals] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const getRecommendedProducts = useCallback(async (query = '') => {
    setIsLoadingRecommended(true);
    try {
      const response = await axios.get(`${API_URL}/web/recommended-products`, {
        params: { query }
      });
      console.log(response.data,"response.data")
      const products = response.data.map(product => ({
       
        id: product?._id,
        main_image_url: product?.main_image_url,
        en_title: product?.en_title,
        en_category: product?.en_category,
        discount: product?.discount,
        delivery_charges: product?.delivery_charges,
        final_price: product?.final_price,
        vat_included: product?.vat_included,
        ar_title: product?.ar_title,
        ar_category: product?.ar_category, 
      }));
      if (query) {
        setSearchResults(products);
        setCurrentView('searchResults');
      } else {
        setRecommendedProducts(products);
      }
      return products;
    } catch (error) {
      console.error('Error fetching recommended products:', error);
      throw error;
    } finally {
      setIsLoadingRecommended(false);
    }
  }, []);

  const performSearch = useCallback(async (query) => {
    setIsSearching(true);
    await getRecommendedProducts(query);
    setIsSearching(false);
  }, [getRecommendedProducts]);

  const getSuperDeals = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/web/super-deals`);
      return response.data.map(deal => ({
        id: deal._id,
        main_image: deal.main_image,
        en_title: deal.en_title,
        hot_deal: deal.hot_deal,
        delivery_charges: deal.delivery_charges,
        discount: deal.discount,
        actual_price: deal.actual_price,
        total_price: deal.total_price,
        sold: deal.sold,
        quantity: deal.quantity,
      }));
    } catch (error) {
      console.error('Error fetching super deals:', error);
      throw error;
    }
  }, []);

  const getWebProductDataById = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_URL}/web/product/${id}`);
      setProductDetails(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  }, []);

  const createWebOrder = useCallback(async (orderData) => {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating web order:', error);
      throw error;
    }
  }, []);

  const getAllOrdersForUser = useCallback(async () => {
    try {
      const web_user_id = 'user123';
      if (!web_user_id) {
        throw new Error('User ID not found in cookie');
      }
      const response = await axios.get(`${API_URL}/web/orders/${web_user_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }, []);

  const getUserOrders = useCallback(async () => {
    try {
      const web_user_id = Cookies.get('web_user_id');
      if (!web_user_id) {
        throw new Error('User ID not found in cookie');
      }
      const response = await axios.get(`${API_URL}/web/user-orders/${web_user_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }, []);

  const value = {
    recommendedProducts,
    searchResults,
    currentView,
    setCurrentView,
    getRecommendedProducts,
    performSearch,
    superDeals,
    productDetails,
    getSuperDeals,
    getWebProductDataById,
    createWebOrder,
    getAllOrdersForUser,
    getUserOrders,
    isSearching,
    isLoadingRecommended,
  };

  console.log('Context state:', { currentView, searchResults });

  return (
    <WebRelatedContext.Provider value={value}>
      {children}
    </WebRelatedContext.Provider>
  );
};
