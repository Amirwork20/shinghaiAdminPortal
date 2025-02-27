import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAttribute } from '../../context/AttributesContext';

const { Search } = Input;

const AttributeManagement = () => {
  const { attributes, addAttribute, updateAttribute, deleteAttribute, isLoading } = useAttribute();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const showModal = (attribute = null) => {
    setEditingAttribute(attribute);
    form.setFieldsValue({
      attribute_name: attribute ? attribute.attribute_name : ''
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingAttribute(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAttribute) {
        await updateAttribute(editingAttribute._id, values);
        message.success('Attribute updated successfully');
      } else {
        await addAttribute(values);
        message.success('Attribute added successfully');
      }
      handleCancel();
    } catch (error) {
      message.error('Failed to save attribute');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this attribute?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await deleteAttribute(id);
          message.success('Attribute deleted successfully');
        } catch (error) {
          message.error('Failed to delete attribute');
        }
      },
    });
  };

  const filteredAttributes = attributes.filter(attribute => 
    attribute.attribute_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'attribute_name',
      key: 'attribute_name',
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record._id)}
            danger
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Attribute Management</h2>
        <Button 
          type="primary" 
          onClick={() => showModal()} 
          icon={<PlusOutlined />}
        >
          Add Attribute
        </Button>
      </div>

      <Search 
        placeholder="Search attributes"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />

      <Table 
        columns={columns} 
        dataSource={filteredAttributes}
        rowKey="_id"
        loading={isLoading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingAttribute ? "Edit Attribute" : "Add Attribute"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form 
          form={form} 
          onFinish={handleSubmit} 
          layout="vertical"
          initialValues={{ attribute_name: '' }}
        >
          <Form.Item
            name="attribute_name"
            label="Attribute Name"
            rules={[{ required: true, message: 'Please input the attribute name!' }]}
          >
            <Input placeholder="Enter attribute name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingAttribute ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttributeManagement;