import React, { useEffect, useState } from 'react';
import { useLandingImages } from '../../context/LandingImagesContext';
import { useProduct } from '../../context/ProductContext';
import { message, Button, Upload, Spin, Layout, Modal, Tabs, Select, Card, Badge, Tooltip, Progress } from 'antd';
import { UploadOutlined, LoadingOutlined, VideoCameraOutlined, PictureOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

const LandingImages = () => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const [mediaItems, setMediaItems] = useState([]);
  const [optimizationStats, setOptimizationStats] = useState(null);
  const { uploadImage, uploadVideo, deleteImage, deleteVideo } = useProduct();
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

  const handleImageUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingImage(true);
      return;
    }
    if (status === 'done') {
      try {
        console.log('Uploading image:', originFileObj);
        
        const response = await uploadImage(originFileObj);
        console.log('Image upload response:', response);
        
        // Extract URL and additional metadata
        let url, placeholderUrl, optimizationMeta;
        let optimizationWarning = null;
        
        if (typeof response === 'string') {
          // Old format - just URL
          url = response;
        } else {
          // New format with optimization data
          url = response.imageUrl;
          placeholderUrl = response.placeholderUrl;
          
          // Check if there was an optimization warning
          if (response.optimizationError) {
            optimizationWarning = response.optimizationError;
            message.warning(`Image uploaded but optimization failed: ${response.optimizationError}`);
          }
          
          // Create optimization metadata
          optimizationMeta = {
            originalSize: response.originalSize,
            optimizedSize: response.optimizedSize || response.originalSize, // Use original if optimized not available
            contentType: `image/${response.format || 'jpeg'}`,
            hasProgressiveLoading: !!placeholderUrl,
            optimizationWarning: optimizationWarning
          };
        }
        
        // Add the new media with all available metadata
        const newMediaItem = { 
          url, 
          type: 'image',
          ...(placeholderUrl && { placeholderUrl }),
          ...(optimizationMeta && { optimizationMeta })
        };
        
        setMediaItems(prev => [...prev, newMediaItem]);
        
        if (optimizationWarning) {
          message.success(`${info.file.name} uploaded successfully, but without optimization`);
        } else {
          message.success(`${info.file.name} file uploaded and optimized successfully`);
        }
      } catch (error) {
        console.error(`Error uploading image:`, error);
        message.error(`${info.file.name} file upload failed: ${error.message || 'Unknown error'}`);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleVideoUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingVideo(true);
      return;
    }
    if (status === 'done') {
      try {
        console.log('Uploading video:', originFileObj);
        
        message.loading({
          content: 'Processing video. This may take a minute...',
          key: 'videoUpload',
          duration: 0
        });
        
        const response = await uploadVideo(originFileObj);
        console.log('Video upload response:', response);
        
        // Extract URL and additional metadata
        let url, posterUrl, optimizationMeta;
        let optimizationWarning = null;
        
        if (typeof response === 'string') {
          // Old format - just URL
          url = response;
        } else {
          // New format with optimization data
          url = response.videoUrl;
          posterUrl = response.posterUrl;
          
          // Check if there was an optimization warning
          if (response.optimizationError) {
            optimizationWarning = response.optimizationError;
            message.warning({
              content: `Video uploaded but optimization failed: ${response.optimizationError}`,
              key: 'videoUpload'
            });
          } else {
            message.success({
              content: `${info.file.name} video processed and optimized successfully!`,
              key: 'videoUpload'
            });
          }
          
          // Create optimization metadata
          optimizationMeta = {
            originalSize: response.originalSize,
            optimizedSize: response.optimizedSize || response.originalSize, // Use original if optimized not available
            contentType: 'video/mp4',
            hasProgressiveLoading: false,
            optimizationWarning: optimizationWarning
          };
        }
        
        // Add the new media with all available metadata
        const newMediaItem = { 
          url, 
          type: 'video',
          ...(posterUrl && { posterUrl }),
          ...(optimizationMeta && { optimizationMeta })
        };
        
        setMediaItems(prev => [...prev, newMediaItem]);
      } catch (error) {
        console.error(`Error uploading video:`, error);
        message.error({
          content: `${info.file.name} video upload failed: ${error.message || 'Unknown error'}`,
          key: 'videoUpload'
        });
      } finally {
        setUploadingVideo(false);
      }
    }
  };

  const handleDeleteMedia = async (url, mediaType) => {
    // Extract just the filename from the URL for logging/display
    const fileName = url.split('/').pop();
    
    Modal.confirm({
      title: `Delete ${mediaType === 'video' ? 'Video' : 'Image'}`,
      content: `Are you sure you want to delete this ${mediaType}? (${fileName}) This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          message.loading({
            content: `Deleting ${mediaType} ${fileName}...`,
            key: 'deleteMedia',
            duration: 0
          });
          
          // Delete from S3 based on media type
          if (mediaType === 'video') {
            await deleteVideo(url);
            console.log(`Video deleted: ${fileName}`);
          } else {
            await deleteImage(url);
            console.log(`Image deleted: ${fileName}`);
          }
          
          // Remove from local state
          setMediaItems(prev => prev.filter(item => item.url !== url));
          
          message.success({
            content: `${mediaType === 'video' ? 'Video' : 'Image'} ${fileName} deleted successfully`,
            key: 'deleteMedia'
          });
        } catch (error) {
          console.error(`Error deleting ${mediaType} (${fileName}):`, error);
          message.error({
            content: `Failed to delete ${mediaType} ${fileName}: ${error.message || 'Unknown error'}`,
            key: 'deleteMedia'
          });
        }
      }
    });
  };

  const handlePreview = (item) => {
    setPreviewMedia(item.url);
    setPreviewType(item.type);
    setPreviewVisible(true);
  };

  const handleSave = async () => {
    try {
      // Get the previous media items from the server
      const previousMediaItems = landingMedia.length > 0 ? landingMedia : 
                               landingImages.map(url => ({ url, type: 'image' }));
      
      // Find media items that were removed by the user
      const removedMediaItems = previousMediaItems.filter(prevItem => 
        !mediaItems.some(currentItem => currentItem.url === prevItem.url)
      );
      
      // Delete each removed item from S3
      for (const item of removedMediaItems) {
        try {
          const fileName = item.url.split('/').pop();
          
          // Show loading message
          message.loading({
            content: `Cleaning up ${item.type} ${fileName}...`,
            key: `delete-${fileName}`,
            duration: 0
          });
          
          if (item.type === 'video') {
            await deleteVideo(item.url);
            console.log(`Deleted video from S3:`, fileName);
          } else {
            await deleteImage(item.url);
            console.log(`Deleted image from S3:`, fileName);
          }
          
          message.success({
            content: `${item.type === 'video' ? 'Video' : 'Image'} ${fileName} removed.`,
            key: `delete-${fileName}`,
            duration: 2
          });
        } catch (err) {
          console.error(`Failed to delete ${item.type} from S3:`, err);
          // Continue with other deletions even if one fails
        }
      }
      
      // Save the updated media list
      await saveLandingImages(mediaItems);
      message.success('Landing media saved successfully');
    } catch (err) {
      console.error('Failed to save landing media:', err);
      message.error(`Failed to save landing media: ${err.message || 'Unknown error'}`);
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
                      handleImageUpload({ file: { ...file, status: 'done', originFileObj: file } })
                        .then(() => onSuccess('ok'))
                        .catch(error => onError(error));
                    }}
                    showUploadList={false}
                    disabled={uploadingImage || uploadingVideo}
                  >
                    <Button 
                      icon={uploadingImage ? <LoadingOutlined /> : <PictureOutlined />}
                      disabled={uploadingImage || uploadingVideo}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </Upload>
                  
                  <Upload
                    accept="video/*"
                    customRequest={({ file, onSuccess, onError }) => {
                      handleVideoUpload({ file: { ...file, status: 'done', originFileObj: file } })
                        .then(() => onSuccess('ok'))
                        .catch(error => onError(error));
                    }}
                    showUploadList={false}
                    disabled={uploadingImage || uploadingVideo}
                  >
                    <Button 
                      icon={uploadingVideo ? <LoadingOutlined /> : <VideoCameraOutlined />}
                      disabled={uploadingImage || uploadingVideo}
                    >
                      {uploadingVideo ? 'Processing Video...' : 'Upload Video'}
                    </Button>
                  </Upload>
                </div>
                
                {uploadingVideo && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
                    <Spin className="mr-3" />
                    <div>
                      <p className="font-medium">Video processing in progress</p>
                      <p className="text-sm text-gray-500">This may take a minute or two depending on the video size.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaItems.map((item, index) => (
                    <Card
                      key={index}
                      hoverable
                      cover={
                        item.type === 'video' ? (
                          <div className="h-32 bg-gray-100 flex items-center justify-center relative">
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
                                <Button
                                  icon={<DeleteOutlined />}
                                  danger
                                  size="small"
                                  style={{ position: 'absolute', top: 5, right: 5 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(item.url, 'video');
                                  }}
                                />
                              </div>
                            ) : (
                              <>
                                <VideoCameraOutlined style={{ fontSize: 32 }} />
                                <Button
                                  icon={<DeleteOutlined />}
                                  danger
                                  size="small"
                                  style={{ position: 'absolute', top: 5, right: 5 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(item.url, 'video');
                                  }}
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              alt={`media-${index}`} 
                              src={item.url} 
                              className="h-32 w-full object-cover"
                            />
                            <Button
                              icon={<DeleteOutlined />}
                              danger
                              size="small"
                              style={{ position: 'absolute', top: 5, right: 5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMedia(item.url, 'image');
                              }}
                            />
                            {item.placeholderUrl && (
                              <Badge 
                                count="Optimized" 
                                style={{ backgroundColor: '#52c41a' }}
                                className="absolute top-2 left-2"
                              />
                            )}
                          </div>
                        )
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url, item.type)}>
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
              <div className="flex mb-4">
                <Upload
                  accept="image/*"
                  customRequest={({ file, onSuccess, onError }) => {
                    handleImageUpload({ file: { ...file, status: 'done', originFileObj: file } })
                      .then(() => onSuccess('ok'))
                      .catch(error => onError(error));
                  }}
                  showUploadList={false}
                  disabled={uploadingImage || uploadingVideo}
                >
                  <Button 
                    icon={uploadingImage ? <LoadingOutlined /> : <PictureOutlined />}
                    disabled={uploadingImage || uploadingVideo}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </Upload>
              </div>
              
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
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            style={{ position: 'absolute', top: 5, right: 5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(item.url, 'image');
                            }}
                          />
                          {item.placeholderUrl && (
                            <Badge 
                              count="Optimized" 
                              style={{ backgroundColor: '#52c41a' }}
                              className="absolute top-2 left-2"
                            />
                          )}
                        </div>
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url, 'image')}>
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
              <div className="flex mb-4">
                <Upload
                  accept="video/*"
                  customRequest={({ file, onSuccess, onError }) => {
                    handleVideoUpload({ file: { ...file, status: 'done', originFileObj: file } })
                      .then(() => onSuccess('ok'))
                      .catch(error => onError(error));
                  }}
                  showUploadList={false}
                  disabled={uploadingImage || uploadingVideo}
                >
                  <Button 
                    icon={uploadingVideo ? <LoadingOutlined /> : <VideoCameraOutlined />}
                    disabled={uploadingImage || uploadingVideo}
                  >
                    {uploadingVideo ? 'Processing Video...' : 'Upload Video'}
                  </Button>
                </Upload>
              </div>
              
              {uploadingVideo && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
                  <Spin className="mr-3" />
                  <div>
                    <p className="font-medium">Video processing in progress</p>
                    <p className="text-sm text-gray-500">This may take a minute or two depending on the video size.</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaItems
                  .filter(item => item.type === 'video')
                  .map((item, index) => (
                    <Card
                      key={index}
                      hoverable
                      cover={
                        <div className="h-32 bg-gray-100 flex items-center justify-center relative">
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
                              <Button
                                icon={<DeleteOutlined />}
                                danger
                                size="small"
                                style={{ position: 'absolute', top: 5, right: 5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMedia(item.url, 'video');
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <VideoCameraOutlined style={{ fontSize: 32 }} />
                              <Button
                                icon={<DeleteOutlined />}
                                danger
                                size="small"
                                style={{ position: 'absolute', top: 5, right: 5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMedia(item.url, 'video');
                                }}
                              />
                            </>
                          )}
                        </div>
                      }
                      actions={[
                        <Button type="link" onClick={() => handlePreview(item)}>
                          Preview
                        </Button>,
                        <Button type="link" danger onClick={() => handleDeleteMedia(item.url, 'video')}>
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