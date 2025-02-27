import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Modal, Image, Input } from 'antd';
import { EditOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useProduct } from '../../context/ProductContext';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const { Search } = Input;

const ProductList = () => {
  const { 
    products, 
    deleteProduct, 
    getProductById, 
    selectedProduct, 
    setSelectedProduct, 
    isLoading, 
    fetchProducts 
  } = useProduct();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/v1$/, '');

  const handleDeactivate = async (id) => {
    try {
      await deleteProduct(id);
      message.success('Product deactivated successfully');
    } catch (error) {   
      message.error('Failed to deactivate product');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      await getProductById(id);
    } catch (error) {
      message.error('Failed to fetch product details');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'Products.xlsx');
  };

  const filteredProducts = products.filter(product => 
    (product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     product?._id?.toString().includes(searchQuery)) ?? false
  );

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: 'Actual Price',
      dataIndex: 'actual_price',
      key: 'actual_price',
      width: 100,
      render: (price) => `${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Selling Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Discount %',
      dataIndex: 'off_percentage_value',
      key: 'off_percentage_value',
      width: 100,
      render: (value) => `${value}%`,
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
      width: 80,
    },
    {
      title: 'Max Qty/User',
      dataIndex: 'max_quantity_per_user',
      key: 'max_quantity_per_user',
      width: 100,
    },
    {
      title: 'Delivery Charges',
      dataIndex: 'delivery_charges',
      key: 'delivery_charges',
      width: 120,
      render: (charges) => `${parseFloat(charges).toFixed(2)}`,
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost) => `${parseFloat(cost).toFixed(2)}`,
    },
    {
      title: 'Status',
      key: 'status',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.is_deal && <span className="tag">Deal</span>}
          {record.is_hot_deal && <span className="tag">Hot Deal</span>}
          {record.vat_included && <span className="tag">VAT Included</span>}
          {record.is_active ? <span className="tag success">Active</span> : <span className="tag error">Inactive</span>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/dashboard/edit-product/${record._id}`}>
            <Button icon={<EditOutlined />} />
          </Link>
          <Button icon={<EyeInvisibleOutlined />} onClick={() => handleDeactivate(record._id)} />
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record._id)} />
        </Space>
      ),
    },
  ];

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Product List</h2>
      <div className="flex justify-between items-center mb-4">
        <Search 
          placeholder="Search Products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16, width: 300 }}
        />
        <Button type="primary" onClick={exportToExcel}>Export Products</Button>
      </div>
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
      <Modal
        title="Product Details"
        visible={!!selectedProduct}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
      >
        {selectedProduct && (
          <div>
            <h3>Main Image:</h3>
            {selectedProduct.image_url ? (
              <Image
                width={200}
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
              />
            ) : (
              <p>No main image available</p>
            )}

            <h3>Tab Images:</h3>
            {selectedProduct.tabs_image_url && selectedProduct.tabs_image_url.length > 0 ? (
              <Image.PreviewGroup>
                <Space>
                  {selectedProduct.tabs_image_url.map((url, index) => (
                    <Image
                      key={index}
                      width={100}
                      src={url}
                      alt={`Tab image ${index + 1}`}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <p>No tab images available</p>
            )}

            <p><strong>Title:</strong> {selectedProduct.title}</p>
            <p><strong>Price:</strong> ${parseFloat(selectedProduct.price).toFixed(2)}</p>
            <p><strong>Stock:</strong> {selectedProduct.quantity}</p>
            <p><strong>Description:</strong> {selectedProduct.description}</p>
            <h3>Attributes:</h3>
            {selectedProduct.attributes && Array.isArray(selectedProduct.attributes) ? (
              <ul>
                {selectedProduct.attributes.map((attr, index) => (
                  <li key={index}>
                    {attr.attribute_id}: {attr.values.join(', ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No attributes available</p>
            )}
            <p><strong>Is Deal:</strong> {selectedProduct.is_deal ? 'Yes' : 'No'}</p>
            <p><strong>Is Hot Deal:</strong> {selectedProduct.is_hot_deal ? 'Yes' : 'No'}</p>
            <p><strong>VAT Included:</strong> {selectedProduct.vat_included ? 'Yes' : 'No'}</p>
            <p><strong>Max Quantity Per User:</strong> {selectedProduct.max_quantity_per_user}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;