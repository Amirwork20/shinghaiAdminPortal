import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const DashboardContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api/v1';

export const useDashboard = () => useContext(DashboardContext);

const fallbackData = {
  dashboardStats: {
    totalProducts: 150,
    totalCategories: 12,
    totalBrands: 25,
    totalOrders: 1200,
    topSellingProducts: [
      { id: 1, en_title: "Nike Air Max", order_count: 150 },
      { id: 2, en_title: "Adidas Ultraboost", order_count: 120 },
      { id: 3, en_title: "Puma RS-X", order_count: 90 }
    ],
    ordersByStatus: {
      'Pending': 30,
      'Processing': 45,
      'Delivered': 85
    }
  },
  revenueStats: {
    dailyRevenue: [
      { date: '2024-03-01', revenue: '5000' },
      { date: '2024-03-02', revenue: '6200' },
      { date: '2024-03-03', revenue: '4800' }
    ]
  },
  productStats: {
    lowStockProducts: [
      { id: 1, en_title: "Nike Air Force 1", quantity: 5 },
      { id: 2, en_title: "Adidas NMD", quantity: 3 },
      { id: 3, en_title: "Puma Suede", quantity: 4 }
    ]
  },
  monthlyRevenue: [
    { month: '2024-01', revenue: 45000 },
    { month: '2024-02', revenue: 52000 },
    { month: '2024-03', revenue: 48000 }
  ],
  monthlySales: [
    { month: '2024-01', sales: 450 },
    { month: '2024-02', sales: 520 },
    { month: '2024-03', sales: 480 }
  ],
  weeklyRevenue: [
    { week: '2024-W09', revenue: 12000 },
    { week: '2024-W10', revenue: 13500 },
    { week: '2024-W11', revenue: 11800 }
  ],
  weeklySales: [
    { week: '2024-W09', sales: 120 },
    { week: '2024-W10', sales: 135 },
    { week: '2024-W11', sales: 118 }
  ]
};

export const DashboardProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [productStats, setProductStats] = useState({});
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const dataFetchedRef = useRef(false);
  const [delayedFetch, setDelayedFetch] = useState(false);
  const [managerStats, setManagerStats] = useState({});

  const token = Cookies.get('token');

  const fetchData = useCallback(async (endpoint, setter) => {
    try {
      console.log(`Fetching from: ${API_URL}/dashboard${endpoint}`);
      const response = await axios.get(`${API_URL}/dashboard${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (typeof response.data === 'string') {
        throw new Error('Received HTML instead of JSON');
      }
      
      setter(response.data);
    } catch (err) {
      console.error(`Error fetching ${endpoint} data:`, err);
      // Use fallback data based on the endpoint
      switch (endpoint) {
        case '/stats':
          setter(fallbackData.dashboardStats);
          break;
        case '/revenue':
          setter(fallbackData.revenueStats);
          break;
        case '/product-stats':
          setter(fallbackData.productStats);
          break;
        case '/monthly-revenue':
          setter(fallbackData.monthlyRevenue);
          break;
        case '/monthly-sales':
          setter(fallbackData.monthlySales);
          break;
        case '/weekly-revenue':
          setter(fallbackData.weeklyRevenue);
          break;
        case '/weekly-sales':
          setter(fallbackData.weeklySales);
          break;
        default:
          setter({});
      }
    }
  }, [token]);

  const fetchDashboardStats = useCallback(() => fetchData('/stats', setDashboardStats), [fetchData]);
  const fetchRevenueStats = useCallback(() => fetchData('/revenue', setRevenueStats), [fetchData]);
  const fetchProductStats = useCallback(() => fetchData('/product-stats', setProductStats), [fetchData]);
  const fetchMonthlyRevenue = useCallback(() => fetchData('/monthly-revenue', setMonthlyRevenue), [fetchData]);
  const fetchMonthlySales = useCallback(() => fetchData('/monthly-sales', setMonthlySales), [fetchData]);
  const fetchWeeklyRevenue = useCallback(() => fetchData('/weekly-revenue', setWeeklyRevenue), [fetchData]);
  const fetchWeeklySales = useCallback(() => fetchData('/weekly-sales', setWeeklySales), [fetchData]);

  const fetchManagerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/manager-dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagerStats(response.data);
    } catch (err) {
      console.error('Error fetching manager dashboard data:', err);
      setError('Error fetching manager dashboard data');
      // Set fallback manager stats
      setManagerStats({
        totalSales: 1500,
        totalRevenue: 150000,
        averageOrderValue: 100
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAllData = useCallback(async (forceRefetch = false) => {
    if (dataFetchedRef.current && !forceRefetch) return;
    setLoading(true);
    setError(null);
    try {
      if (delayedFetch) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 3-second delay
        setDelayedFetch(false); // Reset the flag
      }
      await Promise.all([
        fetchDashboardStats(),
        fetchRevenueStats(),
        fetchProductStats(),
        fetchMonthlyRevenue(),
        fetchMonthlySales(),
        fetchWeeklyRevenue(),
        fetchWeeklySales()
      ]);
      dataFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching all dashboard data:', err);
      setError('Error fetching all dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchRevenueStats, fetchProductStats, fetchMonthlyRevenue, fetchMonthlySales, fetchWeeklyRevenue, fetchWeeklySales, delayedFetch]);

  const resetDashboardData = useCallback(() => {
    dataFetchedRef.current = false;
    setDashboardStats({});
    setRevenueStats({});
    setProductStats({});
    setMonthlyRevenue([]);
    setMonthlySales([]);
    setWeeklyRevenue([]);
    setWeeklySales([]);
  }, []);

  const value = {
    loading,
    error,
    dashboardStats,
    revenueStats,
    productStats,
    monthlyRevenue,
    monthlySales,
    weeklyRevenue,
    weeklySales,
    setDelayedFetch,
    fetchAllData,
    resetDashboardData,
    managerStats,
    fetchManagerData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
