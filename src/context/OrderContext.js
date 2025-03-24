import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const OrderContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

// const fallbackOrders = {
//   pending: [
//     {
//       _id: 1,
//       customer_details: {
//         email: "john@example.com",
//         first_name: "John",
//         last_name: "Doe",
//         phone: "+971501234567",
//         address: "Downtown Dubai",
//         apartment: "123",
//         city: "Dubai",
//         postal_code: "12345",
//         delivery_city: "Dubai"
//       },
//       order_items: [
//         {
//           product_id: "P101",
//           quantity: 2,
//           size: "L",
//           price: 199.99
//         }
//       ],
//       order_notes: "Please deliver in the evening",
//       subtotal: 399.98,
//       payment_method: "COD",
//       status: "pending",
//       created_at: "2024-03-15",
//       updated_at: "2024-03-15"
//     },
//     {
//       id: 2,
//       web_user_id: "1002",
//       full_name: "Jane Smith",
//       quantity: 1,
//       product_id: "P102",
//       created_at: "2024-03-16",
//       delivery_type_name: "Express Delivery",
//       mobilenumber: "+971502345678",
//       selected_emirates: "Abu Dhabi",
//       delivery_address: "Corniche Road",
//       selected_attributes: "Size: M, Color: Red"
//     }
//   ],
//   confirmed: [
//     {
//       id: 3,
//       web_user_id: "1003",
//       full_name: "Mike Johnson",
//       quantity: 3,
//       product_id: "P103",
//       created_at: "2024-03-14",
//       delivery_type_name: "Next Day Delivery",
//       mobilenumber: "+971503456789",
//       selected_emirates: "Sharjah",
//       delivery_address: "Al Majaz",
//       selected_attributes: "Size: XL, Color: Black"
//     }
//   ],
//   delivered: [
//     {
//       id: 4,
//       web_user_id: "1004",
//       full_name: "Sarah Wilson",
//       quantity: 1,
//       product_id: "P104",
//       created_at: "2024-03-13",
//       delivery_type_name: "Standard Delivery",
//       mobilenumber: "+971504567890",
//       selected_emirates: "Dubai",
//       delivery_address: "Dubai Marina",
//       selected_attributes: "Size: S, Color: White"
//     }
//   ],
//   cancelled: [
//     {
//       id: 5,
//       web_user_id: "1005",
//       full_name: "Alex Brown",
//       quantity: 2,
//       product_id: "P105",
//       created_at: "2024-03-12",
//       delivery_type_name: "Express Delivery",
//       mobilenumber: "+971505678901",
//       selected_emirates: "Ajman",
//       delivery_address: "Al Jurf",
//       selected_attributes: "Size: M, Color: Green"
//     }
//   ]
// };

export const OrderProvider = ({ children }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchPendingOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/orders/pending`, { headers });
      setPendingOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchConfirmedOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/orders/confirmed`, { headers });
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setConfirmedOrders(response.data.data);
      } else {
        console.error('Invalid confirmed orders response format:', response.data);
        setConfirmedOrders([]);
      }
    } catch (error) {
      console.error('Error fetching confirmed orders:', error);
      setConfirmedOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchDeliveredOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/orders/delivered`, { headers });
      
      let ordersData = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && response.data.data) {
        // If data is not an array but exists, wrap it in an array
        ordersData = [response.data.data];
      }
      
      setDeliveredOrders(ordersData);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      setDeliveredOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchCancelledOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/orders/cancelled`, { headers });
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCancelledOrders(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setCancelledOrders(response.data);
      } else {
        console.error('Invalid cancelled orders response format:', response.data);
        setCancelledOrders([]);
      }
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      setCancelledOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const confirmOrder = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/orders/confirm/${id}`, null, { headers });
      await fetchPendingOrders();
      await fetchConfirmedOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  };

  const cancelOrder = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/orders/cancel/${id}`, null, { headers });
      await fetchPendingOrders();
      await fetchCancelledOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  const getOrderDetails = useCallback(async (orderId) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/orders/details/${orderId}`, { headers });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return null;
    }
  }, [getAuthHeaders]);

  const deliverOrder = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/orders/deliver/${id}`, null, { headers });
      await fetchConfirmedOrders();
      await fetchDeliveredOrders();
    } catch (error) {
      console.error('Error delivering order:', error);
      throw error;
    }
  };

  const revokeDeliveredOrder = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/orders/revoke-delivered/${id}`, null, { headers });
      await fetchConfirmedOrders();
      await fetchDeliveredOrders();
    } catch (error) {
      console.error('Error revoking delivered order:', error);
      throw error;
    }
  };

  const assignDeliveryType = async (id, deliveryTypeName) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/orders/${id}/assign-delivery-type`,
        { deliveryTypeName },
        { headers }
      );
      
      // Refresh the order lists after assigning delivery type
      await Promise.all([
        fetchPendingOrders(),
        fetchConfirmedOrders(),
        fetchDeliveredOrders(),
        fetchCancelledOrders()
      ]);

      return response.data;
    } catch (error) {
      console.error('Error assigning delivery type:', error);
      throw error;
    }
  };

  const value = {
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    cancelledOrders,
    isLoading,
    fetchPendingOrders,
    fetchConfirmedOrders,
    fetchDeliveredOrders,
    fetchCancelledOrders,
    confirmOrder,
    cancelOrder,
    getOrderDetails,
    deliverOrder,
    revokeDeliveredOrder,
    assignDeliveryType,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

