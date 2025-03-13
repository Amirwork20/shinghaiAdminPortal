import React, { useEffect, useState } from 'react';
import { useLandingImages } from '../../context/LandingImagesContext';
import { useProduct } from '../../context/ProductContext';
import { message, Button, Upload, Spin, Layout, Modal, Tabs, Select, Card } from 'antd';
import { UploadOutlined, LoadingOutlined, VideoCameraOutlined, PictureOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

const LandingImages = () => {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const [mediaItems, setMediaItems] = useState([]);
  const { uploadImage, uploadVideo } = useProduct();
  const { 
    landingImages = [], 
    landingMedia = [],
    loading = false, 
    error = null, 
    fetchLandingImages,
    saveLandingImages
  } = useLandingImages() || {};
  
  useEffect(() => {
    fetchLandingImages();
  }, []);

  useEffect(() => {
    // Use landingMedia if available, otherwise convert landingImages to media format
    if (landingMedia && landingMedia.length > 0) {
      setMediaItems(landingMedia);
    } else if (landingImages && landingImages.length > 0) {
      setMediaItems(landingImages.map(url => ({ url, type: 'image' })));
    } else {
      setMediaItems([]);
    }
  }, [landingMedia, landingImages]);

  if (!fetchLandingImages) {
    return <div>Error: LandingImages context not found</div>;
  }

  const handleMediaUpload = async (info, mediaType = 'image') => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingMedia(true);
      return;
    }
    if (status === 'done') {
      try {
        console.log(`Uploading ${mediaType}:`, originFileObj);
        
        // Use the appropriate upload function based on media type
        const url = mediaType === 'video' 
          ? await uploadVideo(originFileObj)
          : await uploadImage(originFileObj);
          
        console.log(`${mediaType} uploaded successfully:`, url);
        
        // Add the new media with its type
        setMediaItems(prev => [...prev, { url, type: mediaType }]);
        message.success(`${info.file.name} file uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading ${mediaType}:`, error);
        message.error(`${info.file.name} file upload failed.`);
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleDeleteMedia = (url) => {
    setMediaItems(prev => prev.filter(item => item.url !== url));
    message.success('Media removed from list');
  };

  const handlePreview = (item) => {
    setPreviewMedia(item.url);
    setPreviewType(item.type);
    setPreviewVisible(true);
  };

  const handleSave = async () => {
    try {
      await saveLandingImages(mediaItems);
      message.success('Landing media saved successfully');
    } catch (err) {
      message.error('Failed to save landing media');
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

  const renderMediaPreview = (file) => {
    const mediaType = file.type || (file.url && file.url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image');
    const url = file.url || file.thumbUrl || '';
    
    if (mediaType === 'video') {
      return (
        <div className="relative w-full h-24 bg-gray-100 flex items-center justify-center">
          <VideoCameraOutlined style={{ fontSize: 24 }} />
          <div className="mt-1 text-xs truncate max-w-full px-2">
            {url.split('/').pop()}
          </div>
        </div>
      );
    }
    
    return null; // Use default image preview
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Landing Page Media</h1>
            <Button 
              type="primary" 
              onClick={handleSave}
              disabled={mediaItems.length === 0}
            >
              Save Changes
            </Button>
          </div>
          
          <Tabs defaultActiveKey="all">
            <TabPane tab="All Media" key="all">
              <div className="mb-4">
                <div className="flex flex-wrap gap-4 mb-4">
                  <Upload
                    accept="image/*"
                    customRequest={({ file, onSuccess, onError }) => {
                      handleMediaUpload({ file: { ...file, status: 'done', originFileObj: file } }, 'image')
                        .then(() => onSuccess('ok'))
                        .catch(error => onError(error));
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<PictureOutlined />}>Upload Image</Button>
                  </Upload>
                  
                  <Upload
                    accept="video/*"
                    customRequest={({ file, onSuccess, onError }) => {
                      handleMediaUpload({ file: { ...file, status: 'done', originFileObj: file } }, 'video')
                        .then(() => onSuccess('ok'))
                        .catch(error => onError(error));
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<VideoCameraOutlined />}>Upload Video</Button>
                  </Upload>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaItems.map((item, index) => (
                    <Card
                      key={index}
                      hoverable
                      cover={
                        item.type === 'video' ? (
                          <div className="h-32 bg-gray-100 flex items-center justify-center">
                            <VideoCameraOutlined style={{ fontSize: 32 }} />
                          </div>
                        ) : (
                          <img 
                            alt={`media-${index}`} 
                            src={item.url} 
                            className="h-32 w-full object-cover"
                          />
                        )
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url)}>
                          Delete
                        </Button>
                      ]}
                    >
                      <div className="text-xs truncate">{item.type}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="Images" key="images">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaItems
                  .filter(item => item.type === 'image')
                  .map((item, index) => (
                    <Card
                      key={index}
                      hoverable
                      cover={
                        <img 
                          alt={`image-${index}`} 
                          src={item.url} 
                          className="h-32 w-full object-cover"
                        />
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url)}>
                          Delete
                        </Button>
                      ]}
                    />
                  ))}
              </div>
            </TabPane>
            
            <TabPane tab="Videos" key="videos">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaItems
                  .filter(item => item.type === 'video')
                  .map((item, index) => (
                    <Card
                      key={index}
                      hoverable
                      cover={
                        <div className="h-32 bg-gray-100 flex items-center justify-center">
                          <VideoCameraOutlined style={{ fontSize: 32 }} />
                        </div>
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url)}>
                          Delete
                        </Button>
                      ]}
                    >
                      <div className="text-xs truncate">{item.url.split('/').pop()}</div>
                    </Card>
                  ))}
              </div>
            </TabPane>
          </Tabs>

          <Modal
            visible={previewVisible}
            title="Media Preview"
            footer={null}
            onCancel={() => setPreviewVisible(false)}
            width={previewType === 'video' ? 800 : 600}
          >
            {previewType === 'video' ? (
              <video 
                src={previewMedia} 
                controls 
                style={{ width: '100%' }} 
                autoPlay
              />
            ) : (
              <img 
                alt="preview" 
                style={{ width: '100%' }} 
                src={previewMedia} 
              />
            )}
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default LandingImages; 