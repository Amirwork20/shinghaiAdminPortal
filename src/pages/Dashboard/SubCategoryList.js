import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useSubCategory } from '../../context/SubCategoryContext';
import { useMainCategory } from '../../context/MainCategoryContext';
import { useCategory } from '../../context/CategoryContext';
import { useProduct } from '../../context/ProductContext';

const { Option } = Select;

const SubCategoryList = () => {
  const { 
    subCategories, 
    addSubCategory,
    updateSubCategory, 
    deleteSubCategory, 
    fetchSubCategories,
    isLoading,
    error 
  } = useSubCategory();

  const { mainCategories, fetchMainCategories } = useMainCategory();
  const { categories, fetchCategories } = useCategory();
  const { uploadImage, deleteImage } = useProduct();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSubCategories(),
        fetchMainCategories(),
        fetchCategories()
      ]);
    };
    loadData();
  }, [fetchSubCategories, fetchMainCategories, fetchCategories]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        category_name: category.category_name,
        main_category_id: category.main_category_id?._id
      });
      if (category.image_url) {
        setImageUrl(category.image_url);
      } else {
        setImageUrl(null);
      }
    } else {
      form.resetFields();
      setImageUrl(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    setImageUrl(null);
    form.resetFields();
  };

  const handleImageUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingImage(true);
      return;
    }
    if (status === 'done') {
      try {
        const response = await uploadImage(originFileObj);
        
        // Extract the image URL from the response
        let imageUrl;
        if (typeof response === 'string') {
          imageUrl = response;
        } else if (response && response.imageUrl) {
          imageUrl = response.imageUrl;
        } else if (response && typeof response.toString === 'function') {
          imageUrl = response.toString();
        }
        
        // Delete the previous image if it exists and is different
        if (editingCategory?.image_url && editingCategory.image_url !== imageUrl) {
          try {
            await deleteImage(editingCategory.image_url);
            console.log('Previous image deleted successfully');
          } catch (err) {
            console.error('Failed to delete previous image:', err);
          }
        }
        
        setImageUrl(imageUrl);
        message.success(`${info.file.name} file uploaded successfully`);
      } catch (error) {
        message.error(`${info.file.name} file upload failed.`);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Check if image is missing
      if (!imageUrl && !editingCategory?.image_url) {
        message.warning('Sub-category image is missing. Please upload an image.');
        return;
      }
      
      const categoryData = {
        ...values,
        image_url: imageUrl || editingCategory?.image_url || null,
      };

      if (editingCategory) {
        // Note: We don't need to delete the old image here as it's already handled in handleImageUpload
        await updateSubCategory(editingCategory._id, categoryData);
        message.success('Sub-category updated successfully');
      } else {
        await addSubCategory(categoryData);
        message.success('Sub-category added successfully');
      }
      handleCancel();
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this sub-category?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          // Find the subcategory to get its image URL
          const subCategoryToDelete = subCategories.find(cat => cat._id === id);
          
          // Delete the subcategory from the database
          await deleteSubCategory(id);
          
          // Delete the image if it exists
          if (subCategoryToDelete && subCategoryToDelete.image_url) {
            try {
              const fileName = subCategoryToDelete.image_url.split('/').pop();
              message.loading({
                content: `Deleting image ${fileName}...`,
                key: 'deleteImage',
                duration: 0
              });
              
              await deleteImage(subCategoryToDelete.image_url);
              
              message.success({
                content: `Image ${fileName} deleted successfully`,
                key: 'deleteImage'
              });
              console.log('Sub-category image deleted successfully:', fileName);
            } catch (err) {
              console.error('Failed to delete image:', err);
              message.error({
                content: `Failed to delete image: ${err.message || 'Unknown error'}`,
                key: 'deleteImage'
              });
              // Subcategory was already deleted, so just log error
            }
          }
          
          message.success('Sub-category deleted successfully');
        } catch (error) {
          // Error message will be shown from the context via useEffect
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 150,
      render: (id) => id.substring(id.length - 8),
    },
    {
      title: 'Name',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 150,
    },
    {
      title: 'Main Category',
      dataIndex: ['main_category_id', 'category_name'],
      key: 'main_category_name',
      width: 150,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (imageUrl) => imageUrl ? (
        <img src={imageUrl} alt="Category" style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)} danger />
        </Space>
      ),
    },
  ];

  const filteredSubCategories = subCategories.filter(category =>
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Sub-Category Management</h2>
        <Button type="primary" onClick={() => showModal()} icon={<PlusOutlined />}>
          Add Sub-Category
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
        dataSource={filteredSubCategories}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No sub-categories found' }}
      />

      <Modal
        title={editingCategory ? "Edit Sub-Category" : "Add Sub-Category"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="main_category_id"
            label="Category"
            rules={[{ required: true, message: 'Please select a category!' }]}
          >
            <Select placeholder="Select category">
              {mainCategories.map(category => (
                <Option key={category._id} value={category._id}>
                  {category.category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="category_name"
            label="Sub Category Name"
            rules={[{ required: true, message: 'Please input the sub category name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item 
            label="Category Image"
            required
            tooltip="Please upload an image for the category"
          >
            {editingCategory?.image_url && !imageUrl && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={editingCategory.image_url} 
                    alt="Current Category" 
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', marginBottom: '1rem' }} 
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    style={{ position: 'absolute', top: 5, right: 5 }}
                    onClick={async () => {
                      try {
                        await deleteImage(editingCategory.image_url);
                        setEditingCategory(prev => ({ ...prev, image_url: null }));
                        message.success('Image deleted successfully');
                      } catch (error) {
                        message.error('Failed to delete image');
                      }
                    }}
                  />
                </div>
              </div>
            )}
            {!imageUrl && !editingCategory?.image_url && (
              <div className="mb-2">
                <p className="text-sm text-red-500">An image is required. Please upload one.</p>
              </div>
            )}
            <Upload
              accept="image/*"
              customRequest={({ file, onSuccess }) => {
                setTimeout(() => {
                  onSuccess("ok");
                }, 0);
              }}
              onChange={handleImageUpload}
              maxCount={1}
              listType="picture-card"
              showUploadList={false}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Category" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div>
                  {uploadingImage ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingCategory ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubCategoryList; 