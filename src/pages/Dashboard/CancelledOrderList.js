import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, message, Input, Space, Tooltip } from 'antd';
import { EyeOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useOrder } from '../../context/OrderContext';
import * as XLSX from 'xlsx';

const { Search } = Input;

const CancelledOrderList = () => {
  const { cancelledOrders = [], isLoading, fetchCancelledOrders, getOrderDetails } = useOrder();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchCancelledOrders();
  }, [fetchCancelledOrders]);

  useEffect(() => {
    const validOrders = Array.isArray(cancelledOrders) ? cancelledOrders : [];
    setFilteredOrders(validOrders);
  }, [cancelledOrders]);

  const showModal = async (orderId) => {
    try {
      console.log('Fetching cancelled order details for ID:', orderId);
      const orderDetails = await getOrderDetails(orderId);
      console.log('Cancelled order details response:', orderDetails);
      
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        console.log('Selected cancelled order set:', orderDetails);
      } else {
        console.error('Cancelled order details returned null or undefined');
        message.error('Failed to load order details data');
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching cancelled order details:', error);
      message.error('Failed to fetch order details');
    }
  };

  const handleSearch = (value) => {
    const searchTerm = value.toLowerCase();
    const filtered = cancelledOrders.filter(order => 
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
    const data = filteredOrders.map(order => ({
      'Order ID': order._id,
      'Customer Name': `${order.customer_details?.first_name} ${order.customer_details?.last_name}`,
      'Email': order.customer_details?.email,
      'Phone': order.customer_details?.phone,
      'Address': `${order.customer_details?.address}, ${order.customer_details?.city}`,
      'Items': order.order_items?.length || 0,
      'Subtotal': order.subtotal,
      'Payment Method': order.payment_method,
      'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cancelled Orders');
    XLSX.writeFile(workbook, 'CancelledOrders.xlsx');
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
      render: (record) => `${record.customer_details?.first_name || ''} ${record.customer_details?.last_name || ''}`,
    },
    {
      title: 'Contact',
      key: 'phone',
      width: 130,
      render: (record) => record.customer_details?.phone || 'N/A',
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      render: (record) => record.order_items?.length || 0,
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
        <Tooltip title="View Order Details">
          <Button icon={<EyeOutlined />} onClick={() => showModal(record._id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Cancelled Orders</h2>
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
        >
          Export to Excel
        </Button>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredOrders}
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
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <p><strong>Name:</strong> {`${selectedOrder.customer_details?.first_name} ${selectedOrder.customer_details?.last_name}`}</p>
              <p><strong>Email:</strong> {selectedOrder.customer_details?.email}</p>
              <p><strong>Phone:</strong> {selectedOrder.customer_details?.phone}</p>
              <p><strong>Address:</strong> {selectedOrder.customer_details?.address}</p>
              <p><strong>Apartment:</strong> {selectedOrder.customer_details?.apartment}</p>
              <p><strong>City:</strong> {selectedOrder.customer_details?.city}</p>
              <p><strong>Delivery City:</strong> {selectedOrder.customer_details?.delivery_city}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={index} className="border p-3 rounded">
                    <p><strong>Product:</strong> {item.product_id?.title}</p>
                    {item.attributes ? (
                      <div>
                        <strong>Attributes:</strong>
                        {Object.entries(item.attributes).map(([key, value], attrIndex) => (
                          <p key={attrIndex} className="ml-3">- {key}: {value}</p>
                        ))}
                      </div>
                    ) : (
                      item.size && <p><strong>Size:</strong> {item.size}</p>
                    )}
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Price:</strong> ${item.price?.toFixed(2)}</p>
                    {item.product_id?.image_url && (
                      <img 
                        src={item.product_id.image_url} 
                        alt={item.product_id.title}
                        className="w-20 h-20 object-cover mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.order_notes && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
                <p>{selectedOrder.order_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CancelledOrderList;