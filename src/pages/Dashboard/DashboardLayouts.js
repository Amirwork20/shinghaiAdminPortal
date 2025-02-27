import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  HomeOutlined, 
  UnorderedListOutlined,
  PlusOutlined,
  TagsOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CarOutlined,
  StopOutlined,
  EyeInvisibleOutlined,
  AppstoreOutlined,
  // TrademarkOutlined,
  AppstoreAddOutlined,
  BranchesOutlined,
  // FabricOutlined,
  PictureOutlined,
} from '@ant-design/icons';

const DashboardLayout = () => {
  // State management for sidebar collapse and mobile menu
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Router hooks for navigation and location tracking
  const location = useLocation();
  const navigate = useNavigate();
  
  // Authentication context for user data and logout functionality
  const { logout, user } = useAuth();

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
  };

  // Navigation link component for sidebar items
  const NavLink = ({ to, icon, children }) => (
    <Link to={to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-100 hover:text-green-800 transition-colors duration-200">
      {icon}
      {(!collapsed || mobileMenuOpen) && <span className="ml-3">{children}</span>}
    </Link>
  );

  // Replace both managerLinks and adminLinks with a single links array
  const links = [
    // Dashboard home
    { to: "/dashboard", icon: <HomeOutlined className="mr-3 text-green-600" />, text: "Home" },
    // { to: "/dashboard/header", icon: <HomeOutlined className="mr-3 text-green-600" />, text: "Header" },
    // { to: "/dashboard/nav-menu", icon: <HomeOutlined className="mr-3 text-green-600" />, text: "Nav Menu" },
    // Product management routes
    { to: "/dashboard/products", icon: <UnorderedListOutlined className="mr-3 text-green-600" />, text: "Product List" },
    { to: "/dashboard/non-active-products", icon: <EyeInvisibleOutlined className="mr-3 text-green-600" />, text: "Non-Active Products" },
    { to: "/dashboard/add-product", icon: <PlusOutlined className="mr-3 text-green-600" />, text: "Add Product" },
    // Product attribute routes
    { to: "/dashboard/attributes", icon: <TagsOutlined className="mr-3 text-green-600" />, text: "Attributes" },
    // { to: "/dashboard/categories", icon: <AppstoreOutlined className="mr-3 text-green-600" />, text: "Categories" },
    // { to: "/dashboard/brands", icon: <TrademarkOutlined className="mr-3 text-green-600" />, text: "Brands" },
    // Order management routes
    { to: "/dashboard/orders", icon: <ShoppingCartOutlined className="mr-3 text-green-600" />, text: "Orders" },
    { to: "/dashboard/confirmed-orders", icon: <CheckCircleOutlined className="mr-3 text-green-600" />, text: "Confirmed Orders" },
    { to: "/dashboard/delivered-orders", icon: <CarOutlined className="mr-3 text-green-600" />, text: "Delivered Orders" },
    { to: "/dashboard/cancelled-orders", icon: <StopOutlined className="mr-3 text-green-600" />, text: "Cancelled Orders" },
    // Delivery configuration
    { to: "/dashboard/delivery-types", icon: <CarOutlined className="mr-3 text-green-600" />, text: "Delivery Types" },
    { to: "/dashboard/main-categories", icon: <AppstoreOutlined className="mr-3 text-green-600" />, text: "Categories" },
    { to: "/dashboard/sub-categories", icon: <BranchesOutlined className="mr-3 text-green-600" />, text: "Sub Categories" },
    { to: "/dashboard/categories", icon: <AppstoreAddOutlined className="mr-3 text-green-600" />, text: "Sub Sub Categories" },
    { to: "/dashboard/fabrics", icon: <TagsOutlined className="mr-3 text-green-600" />, text: "Fabrics" },
    {
      to: "/dashboard/landing-images",
      icon: <PictureOutlined className="mr-3 text-green-600" />,
      text: "Landing Images"
    },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      <aside className={`bg-green-50 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'fixed inset-0 z-50' : 'hidden'} md:block ${collapsed ? 'md:w-16' : 'md:w-64'} overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-green-100`}>
        <div className="p-4 flex justify-between items-center">
          {(!collapsed || mobileMenuOpen) && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mr-2 text-green-600">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <h1 className="text-xl font-semibold text-green-800">SHINGHAI</h1>
            </div>
          )}
          <button onClick={mobileMenuOpen ? toggleMobileMenu : toggle} className="p-2 rounded-full hover:bg-green-200 transition-colors duration-200 md:hidden">
            {mobileMenuOpen ? <FiX className="text-green-800" /> : <FiMenu className="text-green-800" />}
          </button>
          <button onClick={toggle} className="p-2 rounded-full hover:bg-green-200 transition-colors duration-200 hidden md:block">
            <FiMenu className="text-green-800" />
          </button>
        </div>
        <nav className="mt-4">
          {links.map((link, index) => (
            <NavLink key={index} to={link.to} icon={link.icon}>{link.text}</NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-green-100 hover:text-green-800 transition-colors duration-200"
          >
            <FiLogOut className="mr-3 text-green-600" />
            {(!collapsed || mobileMenuOpen) && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-green-100 shadow-md p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-green-800">Dashboard</h2>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="mr-4 p-2 rounded-full hover:bg-green-200 transition-colors duration-200"
            >
              <FiLogOut className="text-green-800" />
            </button>
            <button onClick={toggleMobileMenu} className="p-2 rounded-full hover:bg-green-200 transition-colors duration-200 md:hidden">
              <FiMenu className="text-green-800" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-green-50 p-6 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-green-100" style={{ maxHeight: '90vh' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
