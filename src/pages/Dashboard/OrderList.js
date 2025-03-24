import React, { useEffect, useState } from 'react';
import { FiEye, FiCheckCircle, FiX } from 'react-icons/fi';
import { Modal, Button, Table, message, Input, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useOrder } from '../../context/OrderContext';
import * as XLSX from 'xlsx';

const { Search } = Input;
const { confirm } = Modal;

const OrderList = () => {
  const { pendingOrders = [], isLoading, fetchPendingOrders, confirmOrder, cancelOrder, getOrderDetails } = useOrder();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const showModal = async (orderId) => {
    try {
      console.log('Fetching order details for ID:', orderId);
      const orderDetails = await getOrderDetails(orderId);
      console.log('Order details response:', orderDetails);
      
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        console.log('Selected order set:', orderDetails);
      } else {
        console.error('Order details returned null or undefined');
        message.error('Failed to load order details data');
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      message.error('Failed to fetch order details');
    }
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleConfirmOrder = async (id, orderInfo) => {
    const customerName = orderInfo.customer_details ? 
      `${orderInfo.customer_details.first_name} ${orderInfo.customer_details.last_name}` : 
      'Unknown';
    
    let confirmModal;  
    
    confirmModal = confirm({
      title: 'Confirm Order',
      icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <p>Are you sure you want to confirm this order?</p>
          <p><strong>Order ID:</strong> {id}</p>
          <p><strong>Customer:</strong> {customerName}</p>
          <p><strong>Total:</strong> ${orderInfo.subtotal?.toFixed(2) || '0.00'}</p>
        </div>
      ),
      okText: 'Yes, Confirm',
      okType: 'primary',
      cancelText: 'No',
      okButtonProps: {
        loading: false,
      },
      onOk: async () => {
        // Set button to loading state
        confirmModal.update({
          okButtonProps: {
            loading: true,
          }
        });
        
        try {
          await confirmOrder(id);
          message.success('Order confirmed successfully');
          await fetchPendingOrders();
          return Promise.resolve();
        } catch (error) {
          console.error('Error confirming order:', error);
          message.error(`Failed to confirm order: ${error.message || 'Unknown error'}`);
          
          // Reset loading state on error
          confirmModal.update({
            okButtonProps: {
              loading: false,
            }
          });
          
          return Promise.reject();
        }
      },
    });
  };

  const handleCancelOrder = async (id, orderInfo) => {
    const customerName = orderInfo.customer_details ? 
      `${orderInfo.customer_details.first_name} ${orderInfo.customer_details.last_name}` : 
      'Unknown';
      
    let cancelModal;
    
    cancelModal = confirm({
      title: 'Cancel Order',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to cancel this order?</p>
          <p><strong>Order ID:</strong> {id}</p>
          <p><strong>Customer:</strong> {customerName}</p>
          <p><strong>Total:</strong> ${orderInfo.subtotal?.toFixed(2) || '0.00'}</p>
        </div>
      ),
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      okButtonProps: {
        loading: false,
      },
      onOk: async () => {
        // Set button to loading state
        cancelModal.update({
          okButtonProps: {
            loading: true,
          }
        });
        
        try {
          await cancelOrder(id);
          message.success('Order cancelled successfully');
          await fetchPendingOrders();
          return Promise.resolve();
        } catch (error) {
          console.error('Error cancelling order:', error);
          message.error(`Failed to cancel order: ${error.message || 'Unknown error'}`);
          
          // Reset loading state on error
          cancelModal.update({
            okButtonProps: {
              loading: false,
            }
          });
          
          return Promise.reject();
        }
      },
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(pendingOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  const filteredOrders = Array.isArray(pendingOrders) 
    ? pendingOrders.filter(order => 
        order?.customer_details?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        `${order?.customer_details?.first_name} ${order?.customer_details?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.customer_details?.phone?.includes(searchQuery)
      )
    : [];

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
    },
    {
      title: 'Customer',
      dataIndex: ['customer_details', 'first_name'],
      key: 'customer_name',
      width: 150,
      render: (_, record) => `${record.customer_details.first_name} ${record.customer_details.last_name}`,
    },
    {
      title: 'Contact',
      dataIndex: ['customer_details', 'phone'],
      key: 'phone',
      width: 130,
    },
    {
      title: 'Items',
      dataIndex: 'order_items',
      key: 'items',
      width: 80,
      render: (items) => items.length,
    },
    {
      title: 'Total',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      render: (subtotal) => `$${subtotal.toFixed(2)}`,
    },
    {
      title: 'Payment',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div className="flex space-x-2">
          <Tooltip title="View Order Details">
            <Button
              icon={<FiEye />}
              onClick={() => showModal(record._id)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Confirm Order">
            <Button
              icon={<FiCheckCircle />}
              onClick={() => handleConfirmOrder(record._id, record)}
              className="text-green-600 hover:text-green-800"
            />
          </Tooltip>
          <Tooltip title="Cancel Order">
            <Button
              icon={<FiX />}
              onClick={() => handleCancelOrder(record._id, record)}
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Pending Order List</h2>
      <div className="flex justify-between items-center mb-4">
        <Search 
          placeholder="Search by Email, Name or Phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16, width: 300 }}
        />
        <Button type="primary" onClick={exportToExcel}>Export Orders</Button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <Table 
          columns={columns} 
          dataSource={filteredOrders} 
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            responsive: true,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </div>

      <Modal
        title="Order Details"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="space-y-2">
            <p><strong>Order ID:</strong> {selectedOrder._id}</p>
            {selectedOrder.customer_details && (
              <>
                <p><strong>Customer Name:</strong> {`${selectedOrder.customer_details.first_name || ''} ${selectedOrder.customer_details.last_name || ''}`}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_details.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer_details.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {`${selectedOrder.customer_details.address || ''}, ${selectedOrder.customer_details.apartment || ''}`}</p>
                <p><strong>City:</strong> {selectedOrder.customer_details.city || 'N/A'}</p>
                <p><strong>Delivery City:</strong> {selectedOrder.customer_details.delivery_city || 'N/A'}</p>
              </>
            )}
            {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
              <div className="border-t border-b my-3 py-3">
                <p className="font-semibold mb-2">Items:</p>
                <ul className="space-y-2">
                  {selectedOrder.order_items.map((item, index) => (
                    <li key={index} className="border p-2 rounded">
                      <p><strong>Product:</strong> {item.product_id?.title || 'N/A'}</p>
                      {item.attributes ? (
                        <p>
                          <strong>Attributes:</strong> {Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      ) : (
                        <p><strong>Size:</strong> {item.size || 'N/A'}</p>
                      )}
                      <p><strong>Quantity:</strong> {item.quantity || 0}</p>
                      <p><strong>Price:</strong> ${item.price?.toFixed(2) || '0.00'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic">No items in this order</p>
            )}
            <p><strong>Subtotal:</strong> ${selectedOrder.subtotal?.toFixed(2) || '0.00'}</p>
            <p><strong>Payment Method:</strong> {selectedOrder.payment_method || 'N/A'}</p>
            <p><strong>Order Notes:</strong> {selectedOrder.order_notes || 'N/A'}</p>
            <p><strong>Date:</strong> {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;