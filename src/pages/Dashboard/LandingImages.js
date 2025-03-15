import React, { useEffect, useState } from 'react';
import { useLandingImages } from '../../context/LandingImagesContext';
import { useProduct } from '../../context/ProductContext';
import { message, Button, Upload, Spin, Layout, Modal, Tabs, Select, Card, Badge, Tooltip, Progress } from 'antd';
import { UploadOutlined, LoadingOutlined, VideoCameraOutlined, PictureOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

const LandingImages = () => {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const [mediaItems, setMediaItems] = useState([]);
  const [optimizationStats, setOptimizationStats] = useState(null);
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
      
      // Calculate optimization stats if available
      const totalOriginalSize = landingMedia.reduce((sum, item) => {
        return sum + (item.optimizationMeta?.originalSize || 0);
      }, 0);
      
      const totalOptimizedSize = landingMedia.reduce((sum, item) => {
        return sum + (item.optimizationMeta?.optimizedSize || 0);
      }, 0);
      
      if (totalOriginalSize > 0 && totalOptimizedSize > 0) {
        setOptimizationStats({
          originalSize: formatFileSize(totalOriginalSize),
          optimizedSize: formatFileSize(totalOptimizedSize),
          savedPercentage: Math.round((1 - (totalOptimizedSize / totalOriginalSize)) * 100)
        });
      }
    } else if (landingImages && landingImages.length > 0) {
      setMediaItems(landingImages.map(url => ({ url, type: 'image' })));
    } else {
      setMediaItems([]);
    }
  }, [landingMedia, landingImages]);

  // Format file size in KB, MB, etc.
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        let response;
        if (mediaType === 'video') {
          response = await uploadVideo(originFileObj);
          console.log('Video upload response:', response);
        } else {
          response = await uploadImage(originFileObj);
          console.log('Image upload response:', response);
        }
        
        // Extract URL and additional metadata
        let url, placeholderUrl, posterUrl, optimizationMeta;
        let optimizationWarning = null;
        
        if (typeof response === 'string') {
          // Old format - just URL
          url = response;
        } else {
          // New format with optimization data
          url = mediaType === 'video' ? response.videoUrl : response.imageUrl;
          placeholderUrl = response.placeholderUrl;
          posterUrl = response.posterUrl;
          
          // Check if there was an optimization warning
          if (response.optimizationError) {
            optimizationWarning = response.optimizationError;
            message.warning(`Media uploaded but optimization failed: ${response.optimizationError}`);
          }
          
          // Create optimization metadata
          optimizationMeta = {
            originalSize: response.originalSize,
            optimizedSize: response.optimizedSize || response.originalSize, // Use original if optimized not available
            contentType: mediaType === 'video' ? 'video/mp4' : `image/${response.format || 'jpeg'}`,
            hasProgressiveLoading: !!placeholderUrl,
            optimizationWarning: optimizationWarning
          };
        }
        
        // Add the new media with all available metadata
        const newMediaItem = { 
          url, 
          type: mediaType,
          ...(placeholderUrl && { placeholderUrl }),
          ...(posterUrl && { posterUrl }),
          ...(optimizationMeta && { optimizationMeta })
        };
        
        setMediaItems(prev => [...prev, newMediaItem]);
        
        if (optimizationWarning) {
          message.success(`${info.file.name} uploaded successfully, but without optimization`);
        } else {
          message.success(`${info.file.name} file uploaded and optimized successfully`);
        }
      } catch (error) {
        console.error(`Error uploading ${mediaType}:`, error);
        message.error(`${info.file.name} file upload failed: ${error.message || 'Unknown error'}`);
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
          
          {/* Optimization Stats */}
          {optimizationStats && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <InfoCircleOutlined className="mr-2 text-blue-500" />
                <span className="font-medium">Media Optimization Summary</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-gray-500">Original Size</div>
                  <div className="font-medium">{optimizationStats.originalSize}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Optimized Size</div>
                  <div className="font-medium">{optimizationStats.optimizedSize}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Space Saved</div>
                  <div className="flex items-center">
                    <span className="font-medium text-green-600">{optimizationStats.savedPercentage}%</span>
                    <Progress 
                      percent={optimizationStats.savedPercentage} 
                      size="small" 
                      className="ml-2 w-20"
                      showInfo={false}
                      strokeColor="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
                            {item.posterUrl ? (
                              <div className="relative w-full h-full">
                                <img 
                                  src={item.posterUrl} 
                                  alt="Video poster" 
                                  className="h-32 w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                  <VideoCameraOutlined style={{ fontSize: 32, color: 'white' }} />
                                </div>
                              </div>
                            ) : (
                              <VideoCameraOutlined style={{ fontSize: 32 }} />
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              alt={`media-${index}`} 
                              src={item.url} 
                              className="h-32 w-full object-cover"
                            />
                            {item.placeholderUrl && (
                              <Badge 
                                count="Optimized" 
                                style={{ backgroundColor: '#52c41a' }}
                                className="absolute top-2 right-2"
                              />
                            )}
                          </div>
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
                      <div className="flex justify-between items-center">
                        <div className="text-xs truncate">{item.type}</div>
                        {item.optimizationMeta && (
                          <Tooltip title={
                            item.optimizationMeta.optimizationWarning 
                              ? `Warning: ${item.optimizationMeta.optimizationWarning}` 
                              : `Original: ${formatFileSize(item.optimizationMeta.originalSize)}, Optimized: ${formatFileSize(item.optimizationMeta.optimizedSize)}`
                          }>
                            <InfoCircleOutlined className={item.optimizationMeta.optimizationWarning ? "text-orange-500" : "text-blue-500"} />
                          </Tooltip>
                        )}
                      </div>
                      {item.optimizationMeta?.optimizationWarning && (
                        <div className="text-xs text-orange-500 mt-1">
                          Optimization skipped
                        </div>
                      )}
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
                        <div className="relative">
                          <img 
                            alt={`image-${index}`} 
                            src={item.url} 
                            className="h-32 w-full object-cover"
                          />
                          {item.placeholderUrl && (
                            <Badge 
                              count="Optimized" 
                              style={{ backgroundColor: '#52c41a' }}
                              className="absolute top-2 right-2"
                            />
                          )}
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
                      {item.optimizationMeta && (
                        <div className="text-xs text-gray-500">
                          Saved: {Math.round((1 - (item.optimizationMeta.optimizedSize / item.optimizationMeta.originalSize)) * 100)}%
                        </div>
                      )}
                    </Card>
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
                          {item.posterUrl ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={item.posterUrl} 
                                alt="Video poster" 
                                className="h-32 w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <VideoCameraOutlined style={{ fontSize: 32, color: 'white' }} />
                              </div>
                            </div>
                          ) : (
                            <VideoCameraOutlined style={{ fontSize: 32 }} />
                          )}
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
                      <div className="text-xs truncate flex justify-between">
                        <span>{item.url.split('/').pop()}</span>
                        {item.optimizationMeta && (
                          <Tooltip title={
                            item.optimizationMeta.optimizationWarning 
                              ? `Warning: ${item.optimizationMeta.optimizationWarning}` 
                              : `Original: ${formatFileSize(item.optimizationMeta.originalSize)}, Optimized: ${formatFileSize(item.optimizationMeta.optimizedSize)}`
                          }>
                            <InfoCircleOutlined className={item.optimizationMeta.optimizationWarning ? "text-orange-500" : "text-blue-500"} />
                          </Tooltip>
                        )}
                      </div>
                      {item.optimizationMeta?.optimizationWarning && (
                        <div className="text-xs text-orange-500 mt-1">
                          Optimization skipped
                        </div>
                      )}
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