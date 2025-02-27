import React, { useState, useEffect } from 'react';
import { Table, Button, message, Input } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { useProduct } from '../../context/ProductContext';
import * as XLSX from 'xlsx';

const { Search } = Input;

const NonActiveProduct = () => {
  const { nonActiveProducts, reactivateProduct, isLoading, fetchProducts } = useProduct();
  const [reactivatingId, setReactivatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReactivate = async (id) => {
    setReactivatingId(id);
    try {
      await reactivateProduct(id);
      message.success('Product reactivated successfully');
      fetchProducts(); // Fetch updated data after reactivation
    } catch (error) {
      message.error('Failed to reactivate product: ' + (error.response?.data?.message || error.message));
    } finally {
      setReactivatingId(null);
    }
  };

  const handleExport = () => {
    const data = nonActiveProducts.map(product => ({
      'Name': product.title,
      'Price': product.price,
      'Stock': product.quantity,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NonActiveProducts');
    XLSX.writeFile(workbook, 'NonActiveProducts.xlsx');
  };

  const filteredProducts = nonActiveProducts.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product._id.toString().includes(searchQuery)
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button 
          icon={<RedoOutlined />} 
          onClick={() => handleReactivate(record._id)}
          loading={reactivatingId === record._id}
        />
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Non-Active Products</h2>
      <Search 
        placeholder="Search Products"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />
      <Button onClick={handleExport} style={{ marginBottom: 16 }}>
        Export to Excel
      </Button>
      <div style={{ overflowX: 'auto' }}>
        <Table 
          columns={columns} 
          dataSource={filteredProducts} 
          rowKey="id" 
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            responsive: true,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </div>
    </div>
  );
};

export default NonActiveProduct;
