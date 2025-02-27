import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, message, Select, Input } from 'antd';
import { EyeOutlined, CarOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useOrder } from '../../context/OrderContext';
import { useDeliveryType } from '../../context/deliveryTypeContext';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Search } = Input;

const ConfirmOrderList = () => {
  const { confirmedOrders = [], isLoading, fetchConfirmedOrders, getOrderDetails, deliverOrder, assignDeliveryType } = useOrder();
  const { deliveryTypes, fetchDeliveryTypes } = useDeliveryType();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConfirmedOrders();
    fetchDeliveryTypes();
  }, [fetchConfirmedOrders, fetchDeliveryTypes]);

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

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDeliverOrder = async (id) => {
    try {
      await deliverOrder(id);
      message.success('Order marked as delivered successfully');
      fetchConfirmedOrders();
    } catch (error) {
      message.error('Failed to mark order as delivered');
    }
  };

  const handleAssignDeliveryType = async (orderId, deliveryTypeName) => {
    try {
      await assignDeliveryType(orderId, deliveryTypeName);
      message.success('Delivery type assigned successfully');
      fetchConfirmedOrders();
    } catch (error) {
      message.error('Failed to assign delivery type');
    }
  };

  const handleExportToExcel = () => {
    const data = confirmedOrders.map(order => ({
      'Order ID': order._id,
      'Customer Name': `${order.customer_details.first_name} ${order.customer_details.last_name}`,
      'Email': order.customer_details.email,
      'Phone': order.customer_details.phone,
      'Address': `${order.customer_details.address}, ${order.customer_details.city}`,
      'Items': order.order_items.length,
      'Subtotal': order.subtotal,
      'Payment Method': order.payment_method,
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Delivery Type': order.delivery_type_name || 'Not assigned',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Confirmed Orders');
    XLSX.writeFile(workbook, 'ConfirmedOrders.xlsx');
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
      width: 300,
      render: (record) => (
        <ul>
          {record.order_items?.map((item, index) => (
            <li key={index}>
              {item.product_id?.title} - {item.size}, Qty: {item.quantity}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      render: (subtotal) => `$${(subtotal || 0).toFixed(2)}`,
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
      width: 150,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showModal(record._id)}
          >
            View
          </Button>
          <Button
            icon={<CarOutlined />}
            onClick={() => handleDeliverOrder(record._id)}
          >
            Deliver
          </Button>
        </Space>
      ),
    },
  ];

  const filteredOrders = Array.isArray(confirmedOrders) 
    ? confirmedOrders.filter(order => 
        order?.customer_details?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        `${order?.customer_details?.first_name} ${order?.customer_details?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.customer_details?.phone?.includes(searchQuery)
      )
    : [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Confirmed Orders</h2>
      <div className="flex justify-between items-center mb-4">
        <Search 
          placeholder="Search by Email, Name or Phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
        />
        <Button 
          icon={<FileExcelOutlined />}
          onClick={handleExportToExcel}
        >
          Export to Excel
        </Button>
      </div>
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
              <h3 className="text-lg font-semibold mb-2">Order Information</h3>
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
              <p><strong>Subtotal:</strong> ${selectedOrder.subtotal?.toFixed(2)}</p>
            </div>

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
                    <p><strong>Size:</strong> {item.size}</p>
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

export default ConfirmOrderList;