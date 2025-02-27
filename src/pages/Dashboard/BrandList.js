import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useBrand } from '../../context/BrandContext';
import { useCategory } from '../../context/CategoryContext';
import { useMainCategory } from '../../context/MainCategoryContext';
import { useSubCategory } from '../../context/SubCategoryContext';

const { Option } = Select;

const BrandList = () => {
  const { brands, addBrand, updateBrand, deleteBrand, fetchBrands, isLoading } = useBrand();
  const { categories } = useCategory();
  const { mainCategories } = useMainCategory();
  const { subCategories } = useSubCategory();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  useEffect(() => {
    if (isLoading) {
      fetchBrands();
    }
  }, [fetchBrands, isLoading]);

  const showModal = (brand = null) => {
    setEditingBrand(brand);
    form.setFieldsValue(brand || { brand_name: '', category_id: undefined });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingBrand(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBrand) {
        await updateBrand(editingBrand._id, values);
        message.success('Brand updated successfully');
      } else {
        await addBrand(values);
        message.success('Brand added successfully');
      }
      handleCancel();
    } catch (error) {
      message.error('An error occurred. Please try again.');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this brand?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await deleteBrand(id);
          message.success('Brand deleted successfully');
        } catch (error) {
          message.error('An error occurred. Please try again.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Brand Name',
      dataIndex: 'brand_name',
      key: 'brand_name',
      width: 150,
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      key: 'category_id',
      width: 150,
      render: (category_id) => categories.find(cat => cat._id === category_id)?.en_category_name || 'Unknown',
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

  const filteredBrands = brands.filter(brand => 
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Brand Management</h2>
        <Button 
          type="primary" 
          onClick={() => showModal()} 
          icon={<PlusOutlined />}
        >
          Add Brand
        </Button>
      </div>

      <Input 
        placeholder="Search by name" 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
        style={{ marginBottom: 16, width: 300 }}
      />

      <Table 
        columns={columns} 
        dataSource={filteredBrands} 
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingBrand ? "Edit Brand" : "Add Brand"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="brand_name"
            label="Brand Name"
            rules={[{ required: true, message: 'Please input the brand name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="main_category_id"
            label="Main Category"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select main category"
              onChange={(value) => {
                setSelectedMainCategory(value);
                form.setFieldsValue({ sub_category_id: undefined, category_id: undefined });
              }}
            >
              {mainCategories.map(cat => (
                <Option key={cat._id} value={cat._id}>{cat.category_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sub_category_id"
            label="Sub Category"
            rules={[{ required: true }]}
            dependencies={['main_category_id']}
          >
            <Select
              placeholder="Select sub category"
              disabled={!selectedMainCategory}
              onChange={(value) => {
                setSelectedSubCategory(value);
                form.setFieldsValue({ category_id: undefined });
              }}
            >
              {subCategories
                .filter(cat => cat.main_category_id === selectedMainCategory)
                .map(cat => (
                  <Option key={cat._id} value={cat._id}>{cat.category_name}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="category_id"
            label="Category"
            rules={[{ required: true }]}
            dependencies={['sub_category_id']}
          >
            <Select
              placeholder="Select category"
              disabled={!selectedSubCategory}
            >
              {categories
                .filter(cat => cat.sub_category_id === selectedSubCategory)
                .map(cat => (
                  <Option key={cat._id} value={cat._id}>{cat.category_name}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingBrand ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandList;
