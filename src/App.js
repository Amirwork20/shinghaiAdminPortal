import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CategoryProvider } from './context/CategoryContext';
import { BrandProvider } from './context/BrandContext'; // Import BrandProvider
import { DeliveryTypeProvider } from './context/deliveryTypeContext'; // Import DeliveryTypeProvider
import { DashboardProvider } from './context/dashboardContext'; 
import DashboardLayout from './pages/Dashboard/DashboardLayouts';
import ProductList from './pages/Dashboard/ProductList';
import NonActiveProduct from './pages/Dashboard/NonActiveProduct';
import AddProduct from './pages/Dashboard/AddProducts';
import EditProduct from './pages/Dashboard/EditProduct';
import AttributeManagement from './pages/Dashboard/AttributeManagement';
import OrderList from './pages/Dashboard/OrderList';
import ConfirmOrderList from './pages/Dashboard/ConfirmOrderList';
import DeliveredOrderList from './pages/Dashboard/DeliveredOrderList';
import CancelledOrderList from './pages/Dashboard/CancelledOrderList';
import CategoryList from './pages/Dashboard/CategoryList';
import BrandList from './pages/Dashboard/BrandList';
import Login from './pages/Login/Login';
import { GlobalProvider } from './context/GlobalContext';
import Dashboard from './pages/Dashboard/Dashboard';
import DeliveryTypeList from './pages/Dashboard/DeliveryTypeList'; // Import DeliveryTypeList
import ScrollToTop from './components/ScrollToTop';
import MainCategoryList from './pages/Dashboard/MainCategoryList';
import SubCategoryList from './pages/Dashboard/SubCategoryList';
import { Header } from './pages/Dashboard/Header';
import { NavMenuManager } from './pages/Dashboard/NavMenuManager';
import Fabrics from './pages/Dashboard/Fabrics';
import LandingImages from './pages/Dashboard/LandingImages';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  return (
    <Routes>
      {/* Redirect from root to store */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/login" element={<Login />} />
      

      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="header" element={<Header />} />
        <Route path="products" element={<ProductList />} />
        <Route path="nav-menu" element={<NavMenuManager />} />
        <Route path="non-active-products" element={<NonActiveProduct />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="edit-product/:id" element={<EditProduct />} /> 
        <Route path="attributes" element={<AttributeManagement />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="brands" element={<BrandList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="confirmed-orders" element={<ConfirmOrderList />} />
        <Route path="delivered-orders" element={<DeliveredOrderList />} />
        <Route path="cancelled-orders" element={<CancelledOrderList />} />
        <Route path="delivery-types" element={<DeliveryTypeList />} />
        <Route path="main-categories" element={<MainCategoryList />} />
        <Route path="sub-categories" element={<SubCategoryList />} />
        <Route path="fabrics" element={<Fabrics />} />
        <Route path="landing-images" element={<LandingImages />} />
      </Route>

      <Route path="*" element={<h1 className="text-2xl font-bold text-center mt-10">404: Page Not Found</h1>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <GlobalProvider>
        <AuthProvider>
          <DashboardProvider>
            <CategoryProvider>
              <BrandProvider>
                <DeliveryTypeProvider>
                  <AppContent />
                </DeliveryTypeProvider>
              </BrandProvider>
            </CategoryProvider>
          </DashboardProvider>
        </AuthProvider>
      </GlobalProvider>
    </Router>
  );
}

export default App;
