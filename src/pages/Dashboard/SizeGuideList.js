import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Switch, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSizeGuide } from '../../context/SizeGuideContext';

const { confirm } = Modal;
const { TextArea } = Input;

const SizeGuideList = () => {
  const { sizeGuides, fetchSizeGuides, createSizeGuide, updateSizeGuide, deleteSizeGuide, activateSizeGuide, deactivateSizeGuide, isLoading } = useSizeGuide();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [measurements, setMeasurements] = useState([{ label: '', values: { xs: '', s: '', m: '', l: '', xl: '', xxl: '' } }]);

  useEffect(() => {
    fetchSizeGuides(true); // Include inactive guides
  }, [fetchSizeGuides]);

  const showModal = () => {
    setEditingGuide(null);
    form.resetFields();
    setMeasurements([{ label: '', values: { xs: '', s: '', m: '', l: '', xl: '', xxl: '' } }]);
    setModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingGuide(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active
    });
    setMeasurements(record.measurements || [{ label: '', values: { xs: '', s: '', m: '', l: '', xl: '', xxl: '' } }]);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Add measurements to values
      values.measurements = measurements.filter(m => m.label.trim() !== '');
      
      if (editingGuide) {
        await updateSizeGuide(editingGuide._id, values);
        message.success('Size guide updated successfully');
      } else {
        await createSizeGuide(values);
        message.success('Size guide created successfully');
      }
      
      setModalVisible(false);
      fetchSizeGuides(true);
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Error saving size guide');
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Are you sure you want to delete this size guide?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone if the guide is not in use. If it is in use by products, it will be deactivated instead.',
      onOk: async () => {
        try {
          await deleteSizeGuide(id);
          message.success('Size guide deleted successfully');
          fetchSizeGuides(true);
        } catch (error) {
          console.error('Delete error:', error);
          message.error('Error deleting size guide: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const handleToggleActive = async (record) => {
    try {
      if (record.is_active) {
        await deactivateSizeGuide(record._id);
        message.success('Size guide deactivated');
      } else {
        await activateSizeGuide(record._id);
        message.success('Size guide activated');
      }
      fetchSizeGuides(true);
    } catch (error) {
      message.error('Error toggling size guide status');
    }
  };

  const addMeasurementRow = () => {
    setMeasurements([...measurements, { label: '', values: { xs: '', s: '', m: '', l: '', xl: '', xxl: '' } }]);
  };

  const removeMeasurementRow = (index) => {
    const newMeasurements = [...measurements];
    newMeasurements.splice(index, 1);
    setMeasurements(newMeasurements);
  };

  const handleMeasurementChange = (index, field, value) => {
    const newMeasurements = [...measurements];
    if (field === 'label') {
      newMeasurements[index].label = value;
    } else {
      newMeasurements[index].values[field] = value;
    }
    setMeasurements(newMeasurements);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ color: record.is_active ? 'inherit' : '#d9d9d9' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => (
        <span style={{ color: record.is_active ? 'inherit' : '#d9d9d9' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Measurements',
      key: 'measurements',
      render: (_, record) => (
        <span>
          {record.measurements?.length || 0} measurements
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={() => handleToggleActive(record)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this size guide?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Size Guides</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showModal}
        >
          Add Size Guide
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={sizeGuides}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingGuide ? 'Edit Size Guide' : 'Add Size Guide'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={editingGuide ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Measurements</h3>
              <Button type="primary" onClick={addMeasurementRow}>
                Add Measurement
              </Button>
            </div>
            
            {measurements.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 mb-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Measurement</th>
                      <th className="px-2 py-2 border-b">XS</th>
                      <th className="px-2 py-2 border-b">S</th>
                      <th className="px-2 py-2 border-b">M</th>
                      <th className="px-2 py-2 border-b">L</th>
                      <th className="px-2 py-2 border-b">XL</th>
                      <th className="px-2 py-2 border-b">XXL</th>
                      <th className="px-2 py-2 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((measurement, index) => (
                      <tr key={index}>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.label}
                            onChange={e => handleMeasurementChange(index, 'label', e.target.value)}
                            placeholder="e.g. Chest Width"
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.xs}
                            onChange={e => handleMeasurementChange(index, 'xs', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.s}
                            onChange={e => handleMeasurementChange(index, 's', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.m}
                            onChange={e => handleMeasurementChange(index, 'm', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.l}
                            onChange={e => handleMeasurementChange(index, 'l', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.xl}
                            onChange={e => handleMeasurementChange(index, 'xl', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Input
                            value={measurement.values.xxl}
                            onChange={e => handleMeasurementChange(index, 'xxl', e.target.value)}
                            placeholder="cm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <Button 
                            danger 
                            onClick={() => removeMeasurementRow(index)}
                            disabled={measurements.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SizeGuideList; 