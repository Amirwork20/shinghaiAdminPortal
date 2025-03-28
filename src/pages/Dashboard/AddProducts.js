import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Space, Switch, Upload, Layout, Image, Modal } from 'antd';
import { MinusCircleOutlined, PlusOutlined, UploadOutlined, LoadingOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useProduct } from '../../context/ProductContext';
import { useCategory } from '../../context/CategoryContext';
import { useAttribute } from '../../context/AttributesContext';
import { useNavigate } from 'react-router-dom';
import { useMainCategory } from '../../context/MainCategoryContext';
import { useSubCategory } from '../../context/SubCategoryContext';
import { useFabric } from '../../context/FabricContext';
import { useSizeGuide } from '../../context/SizeGuideContext';

const { Option } = Select;
const { TextArea } = Input;
const { Content } = Layout;

const AddProduct = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { addProduct, uploadImage, deleteImage } = useProduct();
  const { categories, fetchCategories } = useCategory();
  const { attributes } = useAttribute();
  const { mainCategories, fetchMainCategories } = useMainCategory();
  const { subCategories, fetchSubCategories } = useSubCategory();
  const { fabrics, fetchFabrics } = useFabric();
  const { sizeGuides, fetchSizeGuides } = useSizeGuide();
  const [loading, setLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState(null);
  const [tabImageUrls, setTabImageUrls] = useState([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingTab, setUploadingTab] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const SEASONS = ['Summer', 'Winter', 'Spring', 'Fall', 'All Season'];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchMainCategories(),
          fetchCategories(),
          fetchSubCategories(),
          fetchFabrics(),
          fetchSizeGuides()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchMainCategories, fetchCategories, fetchSubCategories, fetchFabrics, fetchSizeGuides]);

  const handleSubCategoryChange = (subCategoryId) => {
    setSelectedSubCategory(subCategoryId);
    const filtered = categories.filter(cat => cat.sub_category_id?._id === subCategoryId);
    setFilteredCategories(filtered);
    form.setFieldsValue({ category_id: undefined });
  };

  const calculateFinalPrice = (actualPrice, discountPercentage) => {
    const discount = (actualPrice * discountPercentage) / 100;
    return actualPrice - discount;
  };

  const handlePriceChange = () => {
    const actualPrice = form.getFieldValue('actual_price');
    const discountPercentage = form.getFieldValue('off_percentage_value');
    if (actualPrice && discountPercentage) {
      const calculatedFinalPrice = calculateFinalPrice(actualPrice, discountPercentage);
      form.setFieldsValue({ price: parseFloat(calculatedFinalPrice.toFixed(2)) });
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formattedValues = formatProductData(values);
      await addProduct(formattedValues);
      message.success('Product added successfully');
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatProductData = (values) => {
    const formattedAttributes = Array.isArray(values.attributes) 
      ? values.attributes.filter(attr => attr && attr.attribute_id && attr.values && attr.values.length > 0)
      : [];

    const {tabImages, mainImage, ...restValues} = values;

    // Ensure all URLs are strings
    const image_url = typeof mainImageUrl === 'string' ? mainImageUrl : null;
    const tabs_image_url = tabImageUrls.map(url => {
      if (typeof url === 'string') return url;
      if (url && url.imageUrl) return url.imageUrl;
      if (url && typeof url.toString === 'function') {
        const str = url.toString();
        if (str !== '[object Object]') return str;
      }
      return null;
    }).filter(url => url !== null);

    return {
      ...restValues,
      season: values.season || 'All Season',
      fabric_id: values.fabric_id,
      size_guide_id: values.size_guide_id,
      actual_price: parseFloat(values.actual_price),
      off_percentage_value: parseFloat(values.off_percentage_value),
      price: parseFloat(values.price),
      delivery_charges: parseFloat(values.delivery_charges),
      quantity: parseInt(values.quantity),
      max_quantity_per_user: parseInt(values.max_quantity_per_user),
      sold: parseInt(values.sold),
      attributes: formattedAttributes,
      image_url: image_url,
      tabs_image_url: tabs_image_url,
      is_deal: values.is_deal || false,
      is_hot_deal: values.is_hot_deal || false,
      vat_included: values.vat_included === undefined ? true : values.vat_included
    };
  };

  const handleMainImageUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingMain(true);
      return;
    }
    if (status === 'done') {
      try {
        // Delete the old image if it exists
        if (mainImageUrl) {
          try {
            await deleteImage(mainImageUrl);
          } catch (err) {
            console.error('Failed to delete old main image:', err);
            // Continue even if image deletion fails
          }
        }
        
        const response = await uploadImage(originFileObj);
        
        // Extract the string URL from the response object
        let imageUrl;
        if (typeof response === 'string') {
          imageUrl = response;
        } else if (response && response.imageUrl) {
          imageUrl = response.imageUrl;
        } else if (response && typeof response.toString === 'function') {
          imageUrl = response.toString();
        } else {
          throw new Error('Could not extract URL from upload response');
        }
        
        setMainImageUrl(imageUrl);
        message.success(`${info.file.name} file uploaded successfully`);
      } catch (error) {
        message.error(`${info.file.name} file upload failed.`);
      } finally {
        setUploadingMain(false);
      }
    }
  };

  const handleTabImagesUpload = async (info) => {
    const { status, originFileObj } = info.file;
    if (status === 'uploading') {
      setUploadingTab(true);
      return;
    }
    if (status === 'done') {
      try {
        console.log('Uploading image:', originFileObj);
        const response = await uploadImage(originFileObj);
        console.log('Image uploaded successfully:', response);
        
        // Extract the string URL from the response object
        let imageUrl;
        if (typeof response === 'string') {
          imageUrl = response;
        } else if (response && response.imageUrl) {
          imageUrl = response.imageUrl;
        } else if (response && typeof response.toString === 'function') {
          imageUrl = response.toString();
        } else {
          throw new Error('Could not extract URL from upload response');
        }
        
        setTabImageUrls(prev => [...prev, imageUrl]);
        message.success(`${info.file.name} file uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        message.error(`${info.file.name} file upload failed.`);
      } finally {
        setUploadingTab(false);
      }
    }
  };

  const handlePreview = (url) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const handleDelete = (url) => {
    if (url === mainImageUrl) {
      // Delete the image from S3
      deleteImage(url).catch(err => {
        console.error('Failed to delete image from storage:', err);
      });
      
      setMainImageUrl(null);
      form.setFieldsValue({ mainImage: undefined });
    } else {
      // Delete the image from S3
      deleteImage(url).catch(err => {
        console.error('Failed to delete tab image from storage:', err);
      });
      
      setTabImageUrls(prev => prev.filter(u => u !== url));
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', overflowY: 'auto' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Add Product</h2>
          <Form form={form} onFinish={onFinish} layout="vertical" initialValues={{ attributes: [], vat_included: true, season: 'All Season' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <Form.Item name="main_category_id" label="Main Category" rules={[{ required: true }]}>
                <Select
                  placeholder="Select main category" 
                  onChange={(value) => {
                    setSelectedMainCategory(value);
                    form.setFieldsValue({ 
                      sub_category_id: undefined, 
                      category_id: undefined 
                    });
                    setSelectedSubCategory(null);
                    setFilteredCategories([]);
                  }}
                  loading={isLoading}
                >
                  {mainCategories.map(cat => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.category_name}
                    </Option>
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
                  onChange={handleSubCategoryChange}
                  loading={isLoading}
                >
                  {subCategories
                    .filter(cat => cat.main_category_id?._id === selectedMainCategory)
                    .map(cat => (
                      <Option key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </Option>
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
                  loading={isLoading}
                >
                  {filteredCategories.map(cat => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.category_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="fabric_id" label="Fabric">
                <Select placeholder="Select fabric" allowClear>
                  {fabrics
                    .filter(fabric => fabric.is_active)
                    .map(fabric => (
                      <Option key={fabric._id} value={fabric._id}>
                        {fabric.fabric_name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item name="size_guide_id" label="Size Guide">
                <Select placeholder="Select size guide" allowClear>
                  {sizeGuides
                    .filter(guide => guide.is_active)
                    .map(guide => (
                      <Option key={guide._id} value={guide._id}>
                        {guide.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item name="actual_price" label="Actual Price" rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  onChange={handlePriceChange}
                />
              </Form.Item>
              <Form.Item name="off_percentage_value" label="Discount Percentage" rules={[
                { required: true },
                { type: 'number', min: 0, max: 100, message: 'Please enter a number between 0 and 100' }
              ]}>
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  style={{ width: '100%' }}
                  onChange={handlePriceChange}
                />
              </Form.Item>
              <Form.Item name="price" label="Final Price" rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item name="cost" label="Cost" rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="care_instructions" label="Care Instructions">
                <TextArea rows={4} placeholder="Enter care instructions for the product" />
              </Form.Item>
              <Form.Item name="disclaimer" label="Disclaimer">
                <TextArea rows={4} placeholder="Enter any disclaimers for the product" />
              </Form.Item>
              <Form.Item 
                name="season" 
                label="Season" 
                rules={[{ required: true, message: 'Please select a season' }]}
              >
                <Select placeholder="Select season">
                  {SEASONS.map(season => (
                    <Option key={season} value={season}>
                      {season}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.List name="attributes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" direction="vertical">
                      <Space>
                        <Form.Item
                          {...restField}
                          name={[name, 'attribute_id']}
                          rules={[{ required: true, message: 'Missing attribute' }]}
                        >
                          <Select style={{ width: 130 }} placeholder="Attribute">
                            {attributes.map(attr => (
                              <Option key={attr._id} value={attr._id}>{attr.attribute_name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                      <Form.List name={[name, 'values']}>
                        {(subFields, subOps) => (
                          <>
                            {subFields.map((subField, index) => (
                              <Space key={subField.key}>
                                <Form.Item
                                  {...subField}
                                  validateTrigger={['onChange', 'onBlur']}
                                  rules={[
                                    {
                                      required: true,
                                      whitespace: true,
                                      message: "Please input attribute value or delete this field.",
                                    },
                                  ]}
                                  noStyle
                                >
                                  <Input placeholder="value" style={{ width: '60%' }} />
                                </Form.Item>
                                {subFields.length > 1 ? (
                                  <MinusCircleOutlined
                                    className="dynamic-delete-button"
                                    onClick={() => subOps.remove(subField.name)}
                                  />
                                ) : null}
                              </Space>
                            ))}
                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => subOps.add()}
                                block
                                icon={<PlusOutlined />}
                              >
                                Add value
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Attribute
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <Form.Item name="delivery_charges" label="Delivery Charges" rules={[{ required: true }, { type: 'number' }]}>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  keyboard={false}
                  type="number"
                />
              </Form.Item>
              <Form.Item name="quantity" label="Total Quantity" rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="sold" label="Sold Items" rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  style={{ width: '100%' }}
                  type="number"
                  keyboard={false}
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
              <Form.Item name="max_quantity_per_user" label="Max Quantity Per User" rules={[{ required: true }]}>
                <InputNumber
                  min={1}
                  step={1}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

              <Form.Item name="mainImage" label="Main Image" rules={[{ required: true }]}>
                <Upload
                  accept="image/*"
                  customRequest={({ file, onSuccess }) => {
                    setTimeout(() => {
                      onSuccess("ok");
                    }, 0);
                  }}
                  onChange={handleMainImageUpload}
                  maxCount={1}
                  listType="picture-card"
                  showUploadList={false}
                >
                  {mainImageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={mainImageUrl} alt="Main" style={{ width: '100%' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0 }}>
                        <Button 
                          icon={<EyeOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(mainImageUrl);
                          }}
                        />
                        <Button 
                          icon={<DeleteOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(mainImageUrl);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      {uploadingMain ? <LoadingOutlined /> : <PlusOutlined />}
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

            <Form.Item name="tabImages" label="Tab Images">
              <Upload
                accept="image/*"
                customRequest={({ file, onSuccess, onError }) => {
                  handleTabImagesUpload({ file: { ...file, status: 'done', originFileObj: file } })
                    .then(() => onSuccess('ok'))
                    .catch(error => onError(error));
                }}
                multiple
                listType="picture-card"
                fileList={tabImageUrls.map((url, index) => ({
                  uid: `-${index}`,
                  name: `image-${index}`,
                  status: 'done',
                  url: url,
                }))}
                onPreview={(file) => handlePreview(file.url)}
                onRemove={(file) => handleDelete(file.url)}
              >
                <div>
                  {uploadingTab ? <LoadingOutlined /> : <UploadOutlined />}
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <Form.Item name="is_deal" label="Is Deal" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="is_hot_deal" label="Is Hot Deal" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="vat_included" label="VAT Included" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Product
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
      <Modal
        visible={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Layout>
  );
};

export default AddProduct;