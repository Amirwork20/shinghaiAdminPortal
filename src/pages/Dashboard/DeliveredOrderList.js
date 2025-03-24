import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, message, Input, Space, Tooltip } from 'antd';
import { EyeOutlined, FileExcelOutlined, UndoOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useOrder } from '../../context/OrderContext';
import * as XLSX from 'xlsx';

const { Search } = Input;
const { confirm } = Modal;

const DeliveredOrderList = () => {
  const { deliveredOrders = [], isLoading, fetchDeliveredOrders, getOrderDetails, revokeDeliveredOrder } = useOrder();
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
      console.log('Fetching delivered order details for ID:', orderId);
      const orderDetails = await getOrderDetails(orderId);
      console.log('Delivered order details response:', orderDetails);
      
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        console.log('Selected delivered order set:', orderDetails);
      } else {
        console.error('Delivered order details returned null or undefined');
        message.error('Failed to load order details data');
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching delivered order details:', error);
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

  const handleRevokeOrder = async (id, orderInfo) => {
    const customerName = orderInfo.customer_details ? 
      `${orderInfo.customer_details.first_name} ${orderInfo.customer_details.last_name}` : 
      'Unknown';
    
    let revokeModal;  
    
    revokeModal = confirm({
      title: 'Revoke Delivery Status',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p>Are you sure you want to move this order back to confirmed status?</p>
          <p><strong>Order ID:</strong> {id}</p>
          <p><strong>Customer:</strong> {customerName}</p>
          <p><strong>Total:</strong> ${orderInfo.subtotal?.toFixed(2) || '0.00'}</p>
        </div>
      ),
      okText: 'Yes, Revoke',
      okType: 'warning',
      cancelText: 'No',
      okButtonProps: {
        loading: false,
      },
      onOk: async () => {
        // Set button to loading state
        revokeModal.update({
          okButtonProps: {
            loading: true,
          }
        });
        
        try {
          await revokeDeliveredOrder(id);
          message.success('Order successfully moved back to confirmed status');
          await fetchDeliveredOrders();
          return Promise.resolve();
        } catch (error) {
          console.error('Error revoking order delivery:', error);
          message.error(`Failed to revoke delivery: ${error.message || 'Unknown error'}`);
          
          // Reset loading state on error
          revokeModal.update({
            okButtonProps: {
              loading: false,
            }
          });
          
          return Promise.reject();
        }
      },
    });
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Order Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => showModal(record._id)}
            />
          </Tooltip>
          <Tooltip title="Move Back to Confirmed">
            <Button 
              icon={<UndoOutlined />}
              onClick={() => handleRevokeOrder(record._id, record)}
              type="warning"
            />
          </Tooltip>
        </Space>
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
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Order Information</h3>
              <p><strong>Order ID:</strong> {selectedOrder._id || 'N/A'}</p>
              <p><strong>Date:</strong> {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</p>
              <p><strong>Status:</strong> {selectedOrder.status || 'N/A'}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.payment_method || 'N/A'}</p>
              <p><strong>Subtotal:</strong> ${selectedOrder.subtotal?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <p><strong>Name:</strong> {`${selectedOrder.customer_details?.first_name || ''} ${selectedOrder.customer_details?.last_name || ''}`}</p>
              <p><strong>Email:</strong> {selectedOrder.customer_details?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedOrder.customer_details?.phone || 'N/A'}</p>
              <p><strong>Address:</strong> {selectedOrder.customer_details?.address || 'N/A'}</p>
              <p><strong>Apartment:</strong> {selectedOrder.customer_details?.apartment || 'N/A'}</p>
              <p><strong>City:</strong> {selectedOrder.customer_details?.city || 'N/A'}</p>
              <p><strong>Delivery City:</strong> {selectedOrder.customer_details?.delivery_city || 'N/A'}</p>
            </div>

            {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="border p-3 rounded">
                      <p><strong>Product:</strong> {item.product_id?.title || 'N/A'}</p>
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
                      <p><strong>Quantity:</strong> {item.quantity || 0}</p>
                      <p><strong>Price:</strong> ${item.price?.toFixed(2) || '0.00'}</p>
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
            ) : (
              <p className="text-gray-500 italic">No items in this order</p>
            )}

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

export default DeliveredOrderList;