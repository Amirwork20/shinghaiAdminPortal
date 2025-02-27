import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, message, Input, Space } from 'antd';
import { EyeOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useOrder } from '../../context/OrderContext';
import * as XLSX from 'xlsx';

const { Search } = Input;

const DeliveredOrderList = () => {
  const { deliveredOrders = [], isLoading, fetchDeliveredOrders, getOrderDetails } = useOrder();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchDeliveredOrders();
  }, [fetchDeliveredOrders]);

  useEffect(() => {
    // Ensure deliveredOrders is an array and has valid data
    const validOrders = Array.isArray(deliveredOrders) ? deliveredOrders : [];
    setFilteredOrders(validOrders);
  }, [deliveredOrders]);

  const showModal = async (orderId) => {
    try {
      const orderDetails = await getOrderDetails(orderId);
      if (orderDetails && orderDetails.data) {
        setSelectedOrder(orderDetails.data);
      } else {
        setSelectedOrder(orderDetails);
      }
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch order details');
    }
  };

  const handleSearch = (value) => {
    if (!Array.isArray(deliveredOrders)) {
      setFilteredOrders([]);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered = deliveredOrders.filter(order => 
      order?.customer_details?.first_name?.toLowerCase().includes(searchTerm) ||
      order?.customer_details?.last_name?.toLowerCase().includes(searchTerm) ||
      order?.customer_details?.phone?.includes(searchTerm) ||
      order?._id?.toLowerCase().includes(searchTerm)
    );
    setFilteredOrders(filtered);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleExportToExcel = () => {
    if (!Array.isArray(filteredOrders) || filteredOrders.length === 0) {
      message.warning('No data to export');
      return;
    }

    const data = filteredOrders.map(order => ({
      'Order ID': order._id,
      'Customer Name': `${order.customer_details?.first_name || ''} ${order.customer_details?.last_name || ''}`,
      'Email': order.customer_details?.email || '',
      'Phone': order.customer_details?.phone || '',
      'Address': `${order.customer_details?.address || ''}, ${order.customer_details?.city || ''}`,
      'Items': order.order_items?.length || 0,
      'Subtotal': order.subtotal || 0,
      'Payment Method': order.payment_method || '',
      'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
      'Delivery Type': order.delivery_type_name || 'Not assigned',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivered Orders');
    XLSX.writeFile(workbook, 'DeliveredOrders.xlsx');
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
    },
    {
      title: 'Customer',
      key: 'customer_name',
      width: 150,
      render: (_, record) => 
        `${record.customer_details?.first_name || ''} ${record.customer_details?.last_name || ''}`,
    },
    {
      title: 'Contact',
      key: 'phone',
      width: 130,
      render: (_, record) => record.customer_details?.phone || 'N/A',
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      render: (_, record) => record.order_items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      render: (subtotal) => `$${(subtotal || 0).toFixed(2)}`,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => showModal(record._id)}
        />
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Delivered Orders</h2>
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by customer name or phone"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          onClick={handleExportToExcel}
          disabled={!Array.isArray(filteredOrders) || filteredOrders.length === 0}
        >
          Export to Excel
        </Button>
      </Space>

      <Table 
        columns={columns} 
        dataSource={Array.isArray(filteredOrders) ? filteredOrders : []}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 10,
          responsive: true,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title="Order Details"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p><strong>Order ID:</strong> {selectedOrder._id || 'N/A'}</p>
            <p><strong>Customer Name:</strong> {selectedOrder.full_name || 'N/A'}</p>
            <p><strong>Quantity:</strong> {selectedOrder.quantity || 'N/A'}</p>
            <p><strong>Product ID:</strong> {selectedOrder.product_id || 'N/A'}</p>
            <p><strong>Date:</strong> {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Mobile Number:</strong> {selectedOrder.mobilenumber || 'N/A'}</p>
            <p><strong>Emirates:</strong> {selectedOrder.selected_emirates || 'N/A'}</p>
            <p><strong>Delivery Address:</strong> {selectedOrder.delivery_address || 'N/A'}</p>
            <p><strong>Selected Attributes:</strong> {selectedOrder.selected_attributes || 'N/A'}</p>
            <p><strong>User ID:</strong> {selectedOrder.web_user_id || 'N/A'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveredOrderList;