import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DeliveryTypeContext = createContext();

const fallbackDeliveryTypes = [
  {
    id: 1,
    name: "Standard Delivery"
  },
  {
    id: 2,
    name: "Express Delivery"
  },
  {
    id: 3,
    name: "Next Day Delivery"
  },
  {
    id: 4,
    name: "Same Day Delivery"
  }
];

export const useDeliveryType = () => useContext(DeliveryTypeContext);
const backendUrl = process.env.REACT_APP_BACKEND_URL;

export const DeliveryTypeProvider = ({ children }) => {
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveryTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/delivery-types`);
      setDeliveryTypes(response.data);
    } catch (error) {
      console.error('Error fetching delivery types:', error);
      // Use fallback data if API fails
      setDeliveryTypes(fallbackDeliveryTypes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addDeliveryType = async (deliveryType) => {
    try {
      const response = await axios.post(`${backendUrl}/delivery-types`, deliveryType);
      setDeliveryTypes([...deliveryTypes, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding delivery type:', error);
      // Create fake response with generated ID
      const fakeDeliveryType = {
        ...deliveryType,
        id: Math.floor(Math.random() * 10000)
      };
      setDeliveryTypes(prevTypes => [...prevTypes, fakeDeliveryType]);
      return fakeDeliveryType;
    }
  };

  const updateDeliveryType = async (id, updatedDeliveryType) => {
    try {
      const response = await axios.put(`${backendUrl}/delivery-types/${id}`, updatedDeliveryType);
      setDeliveryTypes(deliveryTypes.map(dt => dt._id === id ? response.data : dt));
      return response.data;
    } catch (error) {
      console.error('Error updating delivery type:', error);
      // Update locally if API fails
      const updatedType = { ...updatedDeliveryType, id };
      setDeliveryTypes(prevTypes => prevTypes.map(dt => dt._id === id ? updatedType : dt));
      return updatedType;
    }
  };

  const deleteDeliveryType = async (id) => {
    try {
      await axios.delete(`${backendUrl}/delivery-types/${id}`);
      setDeliveryTypes(deliveryTypes.filter(dt => dt._id !== id));
    } catch (error) {
      console.error('Error deleting delivery type:', error);
      // Delete locally if API fails
      setDeliveryTypes(prevTypes => prevTypes.filter(dt => dt._id !== id));
    }
  };

  return (
    <DeliveryTypeContext.Provider value={{
      deliveryTypes,
      fetchDeliveryTypes,
      addDeliveryType,
      updateDeliveryType,
      deleteDeliveryType,
      isLoading
    }}>
      {children}
    </DeliveryTypeContext.Provider>
  );
};
