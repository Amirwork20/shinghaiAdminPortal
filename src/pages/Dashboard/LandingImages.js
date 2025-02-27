import React, { useEffect, useState } from 'react';
import { useLandingImages } from '../../context/LandingImagesContext';
import { useProduct } from '../../context/ProductContext';
import { message, Button, Upload, Spin, Layout, Modal } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';

const { Content } = Layout;

const LandingImages = () => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const { uploadImage } = useProduct();
  const { 
    landingImages = [], 
    loading = false, 
    error = null, 
    fetchLandingImages,
    saveLandingImages
  } = useLandingImages() || {};
  
  useEffect(() => {
    fetchLandingImages();
  }, []);

  useEffect(() => {
    setImageUrls(landingImages);
  }, [landingImages]);

  if (!fetchLandingImages) {
    return <div>Error: LandingImages context not found</div>;
  }

  const handleImageUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingImage(true);
      return;
    }
    if (status === 'done') {
      try {
        console.log('Uploading image:', originFileObj);
        const url = await uploadImage(originFileObj);
        console.log('Image uploaded successfully:', url);
        setImageUrls(prev => [...prev, url]);
        message.success(`${info.file.name} file uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        message.error(`${info.file.name} file upload failed.`);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleDeleteImage = (url) => {
    setImageUrls(prev => prev.filter(u => u !== url));
    message.success('Image removed from list');
  };

  const handlePreview = (url) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const handleSave = async () => {
    try {
      await saveLandingImages(imageUrls);
      message.success('Landing images saved successfully');
    } catch (err) {
      message.error('Failed to save landing images');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Landing Page Images</h1>
            <Button 
              type="primary" 
              onClick={handleSave}
              disabled={imageUrls.length === 0}
            >
              Save Changes
            </Button>
          </div>
          
          <Upload
            accept="image/*"
            customRequest={({ file, onSuccess, onError }) => {
              handleImageUpload({ file: { ...file, status: 'done', originFileObj: file } })
                .then(() => onSuccess('ok'))
                .catch(error => onError(error));
            }}
            multiple
            maxCount={5}
            listType="picture-card"
            fileList={imageUrls.map((url, index) => ({
              uid: `-${index}`,
              name: `image-${index}`,
              status: 'done',
              url: url,
            }))}
            onPreview={(file) => handlePreview(file.url)}
            onRemove={(file) => handleDeleteImage(file.url)}
          >
            {imageUrls.length >= 5 ? null : (
              <div>
                {uploadingImage ? <LoadingOutlined /> : <UploadOutlined />}
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>

          <Modal
            visible={previewVisible}
            title="Image Preview"
            footer={null}
            onCancel={() => setPreviewVisible(false)}
          >
            <img alt="preview" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default LandingImages; 