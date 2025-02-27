import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';


const Dashboard = () => {
 
    return <AdminDashboard />;

};

export default Dashboard;