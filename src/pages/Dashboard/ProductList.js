import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, message, Modal, Image, Input } from 'antd';
import { EditOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useProduct } from '../../context/ProductContext';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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

  const handleViewDetails = useCallback(async (id) => {
    try {
      await getProductById(id);
    } catch (error) {
      message.error('Failed to fetch product details');
    }
  }, [getProductById]);

  useEffect(() => {
    // Check if coming back from product edit with a successful update
    if (location.state?.productUpdated && location.state?.productId) {
      handleViewDetails(location.state.productId);
      
      // Clear the location state to prevent modal from showing again on further navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleViewDetails]);

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
      width: 80,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Category',
      key: 'category',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        const mainCategory = record.category_hierarchy?.main_category?.category_name || 
                            (record.category_id?.sub_category?.main_category_id?.category_name || '');
        const subCategory = record.category_hierarchy?.sub_category?.category_name || 
                           (record.category_id?.sub_category?.category_name || '');
        const category = record.category_hierarchy?.category?.category_name || 
                        (record.category_id?.category_name || '');
                            
        return (
          <div>
            {mainCategory && <span className="block text-xs text-gray-500">{mainCategory}</span>}
            {subCategory && <span className="block text-xs text-gray-500">{subCategory}</span>}
            <span className="font-medium">{category || '-'}</span>
          </div>
        );
      }
    },
    {
      title: 'Fabric',
      dataIndex: ['fabric_id', 'fabric_name'],
      key: 'fabric',
      width: 100,
      render: (fabricName) => fabricName || '-',
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      width: 100,
      render: (season) => season || 'All Season',
    },
    {
      title: 'Actual Price',
      dataIndex: 'actual_price',
      key: 'actual_price',
      width: 100,
      render: (price) => `$${parseFloat(price).toFixed(2)}`,
      sorter: (a, b) => a.actual_price - b.actual_price,
    },
    {
      title: 'Selling Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `$${parseFloat(price).toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Discount %',
      dataIndex: 'off_percentage_value',
      key: 'off_percentage_value',
      width: 100,
      render: (value, record) => {
        if (value !== undefined && value !== null) {
          return `${value}%`;
        }
        if (record.actual_price && record.price && record.actual_price > record.price) {
          const discount = ((record.actual_price - record.price) / record.actual_price) * 100;
          return `${discount.toFixed(2)}%`;
        }
        return '0%';
      },
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
      width: 80,
      sorter: (a, b) => a.sold - b.sold,
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
      render: (charges) => charges ? `$${parseFloat(charges).toFixed(2)}` : '$0.00',
      sorter: (a, b) => (a.delivery_charges || 0) - (b.delivery_charges || 0),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost) => `$${parseFloat(cost).toFixed(2)}`,
      sorter: (a, b) => a.cost - b.cost,
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
          rowKey="_id" 
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
        title={<h2 className="text-xl font-semibold">{selectedProduct?.title || 'Product Details'}</h2>}
        visible={!!selectedProduct}
        onCancel={handleCloseModal}
        footer={null}
        width="95%"
        style={{ maxWidth: '1200px' }}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedProduct && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Product Images</h3>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Main Image:</h4>
                  {selectedProduct.image_url ? (
                    <Image
                      width="100%"
                      src={selectedProduct.image_url}
                      alt={selectedProduct.title}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <p>No main image available</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Images:</h4>
                  {selectedProduct.tabs_image_url && selectedProduct.tabs_image_url.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedProduct.tabs_image_url.map((url, index) => (
                          <Image
                            key={index}
                            width="100%"
                            src={url}
                            alt={`Tab image ${index + 1}`}
                            className="rounded-md object-cover"
                          />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <p>No additional images available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-medium">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{selectedProduct.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fabric</p>
                    <p className="font-medium">{selectedProduct.fabric_id?.fabric_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Season</p>
                    <p className="font-medium">{selectedProduct.season || 'All Season'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      {selectedProduct.is_active ? 
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span> : 
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Inactive</span>}
                      {selectedProduct.is_deal && 
                        <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Deal</span>}
                      {selectedProduct.is_hot_deal && 
                        <span className="ml-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Hot Deal</span>}
                      {selectedProduct.vat_included && 
                        <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">VAT</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Category Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Main Category</p>
                    <p className="font-medium">
                      {selectedProduct.category_hierarchy?.main_category?.category_name || 
                       (selectedProduct.category_id?.sub_category?.main_category_id?.category_name) || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sub Category</p>
                    <p className="font-medium">
                      {selectedProduct.category_hierarchy?.sub_category?.category_name || 
                       (selectedProduct.category_id?.sub_category?.category_name) || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">
                      {selectedProduct.category_hierarchy?.category?.category_name || 
                       (selectedProduct.category_id?.category_name) || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Pricing & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Actual Price</p>
                    <p className="font-medium">${parseFloat(selectedProduct.actual_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Selling Price</p>
                    <p className="font-medium">${parseFloat(selectedProduct.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Discount</p>
                    <p className="font-medium">{
                      selectedProduct.off_percentage_value ? 
                      `${selectedProduct.off_percentage_value}%` : 
                      selectedProduct.actual_price > selectedProduct.price ? 
                      `${(((selectedProduct.actual_price - selectedProduct.price) / selectedProduct.actual_price) * 100).toFixed(2)}%` : 
                      '0%'
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost</p>
                    <p className="font-medium">${parseFloat(selectedProduct.cost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Charges</p>
                    <p className="font-medium">${selectedProduct.delivery_charges ? parseFloat(selectedProduct.delivery_charges).toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className="font-medium">{selectedProduct.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sold</p>
                    <p className="font-medium">{selectedProduct.sold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Quantity Per User</p>
                    <p className="font-medium">{selectedProduct.max_quantity_per_user}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Product Details</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p>{selectedProduct.description || 'No description available'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Care Instructions</p>
                  <p>{selectedProduct.care_instructions || 'No care instructions available'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Disclaimer</p>
                  <p>{selectedProduct.disclaimer || 'No disclaimer available'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Attributes</h3>
                {selectedProduct.attributes && Array.isArray(selectedProduct.attributes) && selectedProduct.attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProduct.attributes.map((attr, index) => (
                      <div key={index}>
                        <p className="text-sm text-gray-500 mb-1">{attr.attribute_id}</p>
                        <p className="font-medium">{attr.values.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No attributes available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;