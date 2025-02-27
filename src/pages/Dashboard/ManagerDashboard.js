import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Alert, Typography, Layout } from 'antd';
import { ShoppingOutlined, ShoppingCartOutlined, TagsOutlined, TrademarkOutlined } from '@ant-design/icons';
import { useDashboard } from '../../context/dashboardContext';
import '../../styles/CustomTable.css';

const { Title } = Typography;
const { Content } = Layout;

const ManagerDashboard = () => {
  const { 
    loading, 
    error, 
    managerStats,
    fetchManagerData
  } = useDashboard();

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    fetchManagerData().then(() => {
      setIsInitialLoading(false);
    });
  }, [fetchManagerData]);

  if (isInitialLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) return <Alert message={error} type="error" style={{ margin: '24px' }} />;

  const lowStockColumns = [
    { title: 'Product', dataIndex: 'en_title', key: 'en_title', ellipsis: true },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
  ];

  const topCategoriesColumns = [
    { title: 'Category', dataIndex: 'en_category_name', key: 'en_category_name' },
    { title: 'Product Count', dataIndex: 'product_count', key: 'product_count' },
  ];

  const topBrandsColumns = [
    { title: 'Brand', dataIndex: 'en_brand_name', key: 'en_brand_name' },
    { title: 'Product Count', dataIndex: 'product_count', key: 'product_count' },
  ];

  const topAttributesColumns = [
    { title: 'Attribute', dataIndex: 'en_attribute_name', key: 'en_attribute_name' },
    { title: 'Usage Count', dataIndex: 'usage_count', key: 'usage_count' },
  ];

  const tableProps = {
    pagination: false,
    scroll: { y: 240 },
    className: 'custom-table',
  };

  return (
    <Layout className="bg-green-50">
      <Content className="bg-green-50" style={{ padding: '24px', minHeight: '100vh' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>Manager Dashboard</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Products" value={managerStats?.products?.totalProducts} prefix={<ShoppingOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Categories" value={managerStats?.categories?.totalCategories} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Brands" value={managerStats?.brands?.totalBrands} prefix={<TrademarkOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Attributes" value={managerStats?.attributes?.totalAttributes} prefix={<TagsOutlined />} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="Active Products" hoverable>
              <Statistic value={managerStats?.products?.activeProducts} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Inactive Products" hoverable>
              <Statistic value={managerStats?.products?.inactiveProducts} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card title="Low Stock Products" hoverable>
              {managerStats?.products?.lowStockProducts?.length > 0 ? (
                <div className="custom-table">
                  <Table 
                    dataSource={managerStats.products.lowStockProducts}
                    columns={lowStockColumns} 
                    {...tableProps}
                  />
                </div>
              ) : (
                <Alert message="No low stock products" type="info" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={8}>
            <Card title="Top Categories" hoverable>
              <div className="custom-table">
                <Table 
                  dataSource={managerStats?.categories?.topCategories}
                  columns={topCategoriesColumns} 
                  {...tableProps}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Top Brands" hoverable>
              <div className="custom-table">
                <Table 
                  dataSource={managerStats?.brands?.topBrands}
                  columns={topBrandsColumns} 
                  {...tableProps}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Top Attributes" hoverable>
              <div className="custom-table">
                <Table 
                  dataSource={managerStats?.attributes?.topAttributes}
                  columns={topAttributesColumns} 
                  {...tableProps}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default ManagerDashboard;
