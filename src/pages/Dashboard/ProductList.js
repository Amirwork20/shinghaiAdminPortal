import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Button, Space, message, Modal, Image, Input, Select, Tag, Divider } from 'antd';
import { EditOutlined, EyeInvisibleOutlined, EyeOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useProduct } from '../../context/ProductContext';
import { Link, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

const { Search } = Input;
const { Option } = Select;

const ProductList = () => {
  const { 
    products, 
    deleteProduct, 
    getProductById, 
    selectedProduct, 
    setSelectedProduct, 
    isLoading, 
    fetchProducts,
    searchProducts,
    searchResults,
    clearSearch
  } = useProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();

  const debounceTimerRef = useRef(null);

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

  const searchableColumns = [
    { key: 'all', title: 'All Columns' },
    { key: 'sku', title: 'SKU' },
    { key: 'title', title: 'Title' },
    { key: 'name', title: 'Name' },
    { key: 'category', title: 'Category' },
    { key: 'fabric', title: 'Fabric' },
    { key: 'season', title: 'Season' },
    { key: 'actual_price', title: 'Actual Price' },
    { key: 'price', title: 'Selling Price' },
    { key: 'off_percentage_value', title: 'Discount %' },
    { key: 'quantity', title: 'Stock' },
    { key: 'sold', title: 'Sold' },
    { key: 'max_quantity_per_user', title: 'Max Qty/User' },
    { key: 'delivery_charges', title: 'Delivery Charges' },
    { key: 'cost', title: 'Cost' },
    { key: 'status', title: 'Status' }
  ];

  const filterProductsBySearch = useCallback((products, query, column) => {
    if (!query) return products;
    
    return products.filter(product => {
      const searchTerm = query.toLowerCase();
      
      // Search in all columns
      if (column === 'all') {
        // For searching across all columns
        return (
          product?.title?.toLowerCase().includes(searchTerm) || 
          product?._id?.toString().includes(searchTerm) ||
          product?.sku?.toLowerCase().includes(searchTerm) ||
          String(product?.price || '').includes(searchTerm) ||
          String(product?.actual_price || '').includes(searchTerm) ||
          String(product?.quantity || '').includes(searchTerm) ||
          String(product?.sold || '').includes(searchTerm) ||
          String(product?.max_quantity_per_user || '').includes(searchTerm) ||
          String(product?.delivery_charges || '').includes(searchTerm) ||
          String(product?.cost || '').includes(searchTerm) ||
          String(product?.off_percentage_value || '').includes(searchTerm) ||
          (product?.season || '').toLowerCase().includes(searchTerm) ||
          (product?.fabric_id?.fabric_name || '').toLowerCase().includes(searchTerm) ||
          // Category search in all mode - restore category_hierarchy fields
          (product?.category_hierarchy?.main_category?.category_name || '').toLowerCase().includes(searchTerm) ||
          (product?.category_hierarchy?.sub_category?.category_name || '').toLowerCase().includes(searchTerm) ||
          (product?.category_hierarchy?.category?.category_name || '').toLowerCase().includes(searchTerm) ||
          (product?.category_id?.category_name || '').toLowerCase().includes(searchTerm) ||
          (product?.category_id?.sub_category?.category_name || '').toLowerCase().includes(searchTerm) ||
          (product?.category_id?.sub_category?.main_category_id?.category_name || '').toLowerCase().includes(searchTerm) ||
          // Status search
          (product?.is_active ? 'active' : 'inactive').includes(searchTerm) ||
          (product?.is_deal ? 'deal' : '').includes(searchTerm) ||
          (product?.is_hot_deal ? 'hot deal' : '').includes(searchTerm) ||
          (product?.vat_included ? 'vat included' : '').includes(searchTerm)
        );
      }
      
      // Search in specific column
      switch (column) {
        case 'sku':
          return (product?.sku || '').toLowerCase().includes(searchTerm);
        case 'title':
          return (product?.title || '').toLowerCase().includes(searchTerm);
        case 'name':  // Added case for Name
          return (product?.name || '').toLowerCase().includes(searchTerm) || 
                 (product?.title || '').toLowerCase().includes(searchTerm);
        case 'category':
          // Full category search - restore category_hierarchy references
          const mainCategory = (
            product.category_hierarchy?.main_category?.category_name || 
            product.category_id?.sub_category?.main_category_id?.category_name || 
            ''
          ).toLowerCase();
          const subCategory = (
            product.category_hierarchy?.sub_category?.category_name || 
            product.category_id?.sub_category?.category_name || 
            ''
          ).toLowerCase();
          const category = (
            product.category_hierarchy?.category?.category_name || 
            product.category_id?.category_name || 
            ''
          ).toLowerCase();
          return mainCategory.includes(searchTerm) || subCategory.includes(searchTerm) || category.includes(searchTerm);
        case 'fabric':
          return (product?.fabric_id?.fabric_name || '').toLowerCase().includes(searchTerm);
        case 'season':
          return (product?.season || '').toLowerCase().includes(searchTerm);
        case 'price':
          return String(product?.price || '').includes(searchTerm);
        case 'actual_price':
          return String(product?.actual_price || '').includes(searchTerm);
        case 'off_percentage_value':
          // Check both the direct value and calculated value
          if (product?.off_percentage_value) {
            return String(product.off_percentage_value).includes(searchTerm);
          } else if (product?.actual_price && product?.price && product?.actual_price > product?.price) {
            const discount = ((product.actual_price - product.price) / product.actual_price) * 100;
            return String(discount.toFixed(2)).includes(searchTerm);
          }
          return false;
        case 'quantity':
          return String(product?.quantity || '').includes(searchTerm);
        case 'sold':
          return String(product?.sold || '').includes(searchTerm);
        case 'max_quantity_per_user':
          return String(product?.max_quantity_per_user || '').includes(searchTerm);
        case 'delivery_charges':
          return String(product?.delivery_charges || '').includes(searchTerm);
        case 'cost':
          return String(product?.cost || '').includes(searchTerm);
        case 'status':
          const statusTerms = searchTerm.toLowerCase();
          const isActive = product?.is_active ? 'active' : 'inactive';
          const isDeal = product?.is_deal ? 'deal' : '';
          const isHotDeal = product?.is_hot_deal ? 'hot deal' : '';
          const hasVat = product?.vat_included ? 'vat included' : '';
          
          return isActive.includes(statusTerms) || 
                 isDeal.includes(statusTerms) || 
                 isHotDeal.includes(statusTerms) || 
                 hasVat.includes(statusTerms);
        default:
          return false;
      }
    });
  }, []);

  // Get the appropriate placeholder text
  const getSearchPlaceholder = useCallback(() => {
    const selectedColumn = searchableColumns.find(col => col.key === searchColumn);
    if (searchColumn === 'all') {
      return 'Search in all columns';
    } else if (searchColumn === 'price' || searchColumn === 'actual_price' || 
               searchColumn === 'quantity' || searchColumn === 'sold') {
      return `Search by ${selectedColumn.title} value`;
    } else {
      return `Search by ${selectedColumn.title}`;
    }
  }, [searchColumn, searchableColumns]);

  // Handle search
  const handleSearch = useCallback(async (value, column) => {
    if (!value.trim()) {
      clearSearch();
      return;
    }
    
    // Don't search again if already searching with same parameters
    if (isSearching) return;
    
    setIsSearching(true);
    try {
      // Show searching message
      message.loading({ content: 'Searching products...', key: 'searchMessage', duration: 0 });
      
      const results = await searchProducts(value.trim(), column);
      
      // Show success message with result count
      message.success({ 
        content: `Found ${results.length} products matching your search`, 
        key: 'searchMessage', 
        duration: 2 
      });
    } catch (error) {
      console.error('Search error:', error);
      message.error({ 
        content: 'Failed to search products: ' + (error.message || 'Unknown error'), 
        key: 'searchMessage',
        duration: 3
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchProducts, clearSearch, isSearching, message]);

  // Handle search input changes with debounce
  const handleSearchInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // Clear search results if input is cleared
    if (!newValue.trim()) {
      clearSearch();
      return;
    }
    
    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Only set a timeout for search if we have enough characters
    if (newValue.length > 2) { // Only search when at least 3 characters
      debounceTimerRef.current = setTimeout(() => {
        // Don't auto-search, let the user press the button
        // This helps reduce unnecessary API calls
        // handleSearch(newValue, searchColumn);
      }, 800); // 800ms debounce
    }
  }, [searchColumn, clearSearch]);

  // This will run only once on component mount and cleanup on unmount
  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, [clearSearch]);

  // Get the display products (either search results or all products)
  const displayProducts = searchResults !== null ? searchResults : products;
  const isSearchActive = searchResults !== null;

  const filteredProducts = filterProductsBySearch(displayProducts, searchQuery, searchColumn);

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

  // Show search status
  const renderSearchResults = () => {
    if (!isSearchActive) return null;
    
    return (
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Tag color="blue" icon={<SearchOutlined />}>
            Search Results: {filteredProducts.length} product(s) found
          </Tag>
          <Button 
            size="small" 
            icon={<ClearOutlined />} 
            onClick={() => {
              setSearchQuery('');
              clearSearch();
            }}
          >
            Clear Search
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1>Product List</h1>
        <Space>
          <Button onClick={exportToExcel}>
            Export to Excel
          </Button>
          <Link to="/dashboard/add-product">
            <Button type="primary">
              Add Product
            </Button>
          </Link>
        </Space>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <Select
            value={searchColumn}
            onChange={(value) => {
              setSearchColumn(value);
              // Clear search results when column changes
              clearSearch();
            }}
            style={{ width: 180, marginRight: '8px' }}
            placeholder="Select column"
            disabled={isSearching}
            optionLabelProp="label"
            dropdownMatchSelectWidth={false}
          >
            {searchableColumns.map(column => (
              <Option key={column.key} value={column.key} label={column.title}>
                {column.title}
              </Option>
            ))}
          </Select>
          <Search 
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={handleSearchInputChange}
            onSearch={(value) => handleSearch(value, searchColumn)}
            loading={isSearching}
            style={{ width: '100%' }}
            allowClear
            enterButton
          />
        </div>
        
        {renderSearchResults()}
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