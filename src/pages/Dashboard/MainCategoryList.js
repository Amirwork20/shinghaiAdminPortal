import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useMainCategory } from '../../context/MainCategoryContext';
import { useProduct } from '../../context/ProductContext';

const MainCategoryList = () => {
  const { 
    mainCategories, 
    addMainCategory, 
    updateMainCategory, 
    deleteMainCategory, 
    fetchMainCategories,
    isLoading,
    error
  } = useMainCategory();
  const { uploadImage, deleteImage } = useProduct();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMainCategories();
  }, [fetchMainCategories]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const showModal = (category = null) => {
    setEditingCategory(category);
    form.setFieldsValue(category || { category_name: '' });
    if (category?.image_url) {
      setImageUrl(category.image_url);
    } else {
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
        message.warning('Category image is missing. Please upload an image.');
        return;
      }
      
      const formData = {
        category_name: values.category_name,
        image_url: imageUrl,
      };
      
      if (editingCategory) {
        // Note: We don't need to delete the old image here as it's already handled in handleImageUpload
        await updateMainCategory(editingCategory._id, formData);
        message.success('Main category updated successfully');
      } else {
        await addMainCategory(formData);
        message.success('Main category added successfully');
      }
      handleCancel();
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this main category?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          // Find the category to get its image URL
          const categoryToDelete = mainCategories.find(cat => cat._id === id);
          
          // Delete the category from the database
          await deleteMainCategory(id);
          
          // Delete the image if it exists
          if (categoryToDelete && categoryToDelete.image_url) {
            try {
              const fileName = categoryToDelete.image_url.split('/').pop();
              message.loading({
                content: `Deleting image ${fileName}...`,
                key: 'deleteImage',
                duration: 0
              });
              
              await deleteImage(categoryToDelete.image_url);
              
              message.success({
                content: `Image ${fileName} deleted successfully`,
                key: 'deleteImage'
              });
              console.log('Main category image deleted successfully:', fileName);
            } catch (err) {
              console.error('Failed to delete image:', err);
              message.error({
                content: `Failed to delete image: ${err.message || 'Unknown error'}`,
                key: 'deleteImage'
              });
              // Category was already deleted, so just log error
            }
          }
          
          message.success('Main category deleted successfully');
        } catch (error) {
          // Error message will be shown from the context via useEffect
        }
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 150,
      sorter: (a, b) => a.category_name.localeCompare(b.category_name),
    },
    {
      title: 'Sub Categories',
      dataIndex: 'sub_categories_count',
      key: 'sub_categories_count',
      width: 150,
      render: (_, record) => record.sub_categories?.length || 0,
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Category Management</h2>
        <Button type="primary" onClick={() => showModal()} icon={<PlusOutlined />}>
          Add Category
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
        dataSource={mainCategories.filter(category =>
          category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No categories found' }}
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="category_name"
            label="Category Name"
            rules={[{ required: true, message: 'Please input the category name!' }]}
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

export default MainCategoryList; 