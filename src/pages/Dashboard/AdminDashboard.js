import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Alert, Typography, Layout } from 'antd';
import { ShoppingCartOutlined, ShoppingOutlined, UserOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import { useDashboard } from '../../context/dashboardContext';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, Tooltip, Legend);

const { Title } = Typography;
const { Content } = Layout;

const AdminDashboard = () => {
  const { 
    loading, 
    error, 
    dashboardStats, 
    revenueStats, 
    productStats,
    monthlyRevenue,
    monthlySales,
    weeklyRevenue,
    weeklySales,
    fetchAllData
  } = useDashboard();

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    fetchAllData().then(() => {
      setIsInitialLoading(false);
    });
  }, [fetchAllData]);

  if (isInitialLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) return <Alert message={error} type="error" style={{ margin: '24px' }} />;

  const topProductsColumns = [
    { title: 'Product', dataIndex: 'en_title', key: 'en_title', ellipsis: true },
    { title: 'Orders', dataIndex: 'order_count', key: 'order_count' },
  ];

  const lowStockColumns = [
    { title: 'Product', dataIndex: 'en_title', key: 'en_title', ellipsis: true },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
  ];

  const calculateRevenueSummary = () => {
    if (!revenueStats.dailyRevenue || revenueStats.dailyRevenue.length === 0) {
      return { total: 0, change: 0, isPositive: true };
    }

    const total = revenueStats.dailyRevenue.reduce((sum, day) => sum + parseFloat(day.revenue), 0);
    const lastDayRevenue = parseFloat(revenueStats.dailyRevenue[revenueStats.dailyRevenue.length - 1].revenue);
    const secondLastDayRevenue = parseFloat(revenueStats.dailyRevenue[revenueStats.dailyRevenue.length - 2]?.revenue || 0);
    const change = ((lastDayRevenue - secondLastDayRevenue) / secondLastDayRevenue) * 100;

    return {
      total: total.toFixed(2),
      change: change.toFixed(2),
      isPositive: change >= 0
    };
  };

  const revenueSummary = calculateRevenueSummary();

  const chartData = (data, label) => ({
    labels: data.map(item => new Date(item.month || item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
    datasets: [{
      label,
      data: data.map(item => item.revenue || item.sales),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
    }]
  });

  const orderStatusData = {
    labels: Object.keys(dashboardStats?.ordersByStatus || {}),
    datasets: [{
      data: Object.values(dashboardStats?.ordersByStatus || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <Layout className="bg-green-50">
      <Content className="bg-green-50" style={{ padding: '24px', minHeight: '100vh' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>Dashboard</Title>
        <Row gutter={[24, 24]} >
        <Col xs={24} sm={12} lg={6}>
          <Card title="Monthly Revenue" hoverable>
            <Line data={chartData(monthlyRevenue, 'Monthly Revenue')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Monthly Sales" hoverable>
            <Bar data={chartData(monthlySales, 'Monthly Sales')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Weekly Revenue" hoverable>
            <Line data={chartData(weeklyRevenue, 'Weekly Revenue')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Weekly Sales" hoverable>
            <Bar data={chartData(weeklySales, 'Weekly Sales')} />
          </Card>
        </Col>
      </Row>
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Products" value={dashboardStats?.totalProducts} prefix={<ShoppingOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Categories" value={dashboardStats?.totalCategories} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Brands" value={dashboardStats?.totalBrands} prefix={<ShoppingOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Orders" value={dashboardStats?.totalOrders} prefix={<UserOutlined />} />
            </Card>
          </Col>
        </Row>

      

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="Revenue Summary" hoverable style={{ height: '100%' }}>
              <Statistic
                title="Total Revenue"
                value={revenueSummary.total}
                precision={2}
                valueStyle={{ color: revenueSummary.isPositive ? '#3f8600' : '#cf1322' }}
                prefix={<img src="/riyal.png" alt="Products" style={{ width: '24px', marginRight: '8px' }} />}
                suffix="PKR"
              />
           
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top Selling Products" hoverable style={{ height: '100%' }}>
              {dashboardStats?.topSellingProducts ? (
                <div style={{ overflowX: 'auto' }}>
                  <Table 
                    dataSource={dashboardStats.topSellingProducts}
                    columns={topProductsColumns} 
                    pagination={false}
                    scroll={{ y: 240 }}
                    style={{ minWidth: '300px' }}
                  />
                </div>
              ) : (
                <Alert message="No top selling products data available" type="info" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="Low Stock Products" hoverable>
              {productStats?.lowStockProducts ? (
                <div style={{ overflowX: 'auto' }}>
                  <Table 
                    dataSource={productStats.lowStockProducts}
                    columns={lowStockColumns} 
                    pagination={false}
                    style={{ minWidth: '300px' }}
                  />
                </div>
              ) : (
                <Alert message="No low stock products data available" type="info" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Orders by Status" hoverable>
              {dashboardStats?.ordersByStatus ? (
                <div style={{ height: '200px' }}> {/* Adjust this height as needed */}
                  <Pie data={orderStatusData} options={pieOptions} />
                </div>
              ) : (
                <Alert message="No orders by status data available" type="info" />
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default AdminDashboard;
