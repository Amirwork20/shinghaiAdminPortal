import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Switch, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import { useFabric } from '../../context/FabricContext';

const Fabrics = () => {
  const [form] = Form.useForm();
  const { fabrics, isLoading, fetchFabrics, addFabric, updateFabric, deactivateFabric, activateFabric } = useFabric();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);

  useEffect(() => {
    fetchFabrics();
  }, [fetchFabrics]);

  const showModal = (fabric = null) => {
    setEditingFabric(fabric);
    if (fabric) {
      form.setFieldsValue(fabric);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingFabric(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingFabric) {
        await updateFabric(editingFabric._id, values);
        message.success('Fabric updated successfully');
      } else {
        await addFabric(values);
        message.success('Fabric added successfully');
      }
      handleCancel();
    } catch (error) {
      message.error('Error: ' + error.message);
    }
  };

  const handleStatusChange = async (record) => {
    try {
      if (record.is_active) {
        await deactivateFabric(record._id);
        message.success('Fabric deactivated successfully');
      } else {
        await activateFabric(record._id);
        message.success('Fabric activated successfully');
      }
    } catch (error) {
      message.error('Error changing status: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'Fabric Name',
      dataIndex: 'fabric_name',
      key: 'fabric_name',
      sorter: (a, b) => a.fabric_name.localeCompare(b.fabric_name),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <span className={`${isActive ? 'text-green-600' : 'text-red-600'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title={`Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} this fabric?`}
            onConfirm={() => handleStatusChange(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={record.is_active ? <StopOutlined /> : <CheckOutlined />}
              type={record.is_active ? 'default' : 'primary'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Fabric Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Add Fabric
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={fabrics}
        rowKey="_id"
        loading={isLoading}
      />

      <Modal
        title={editingFabric ? 'Edit Fabric' : 'Add Fabric'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="fabric_name"
            label="Fabric Name"
            rules={[{ required: true, message: 'Please enter fabric name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingFabric ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Fabrics; 