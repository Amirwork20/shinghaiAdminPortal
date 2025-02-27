import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Typography, Space, Spin, Empty } from 'antd';
import { FaTag, FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWebRelated } from '../context/WebRelatedContext';

const { Meta } = Card;
const { Text } = Typography;

const ProductCard = ({ product }) => { 
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!product) return null;
console.log(product,"product")
  const handleCardClick = () => {
    navigate('/place-order#', { state: { product } });
  };

  // Function to check if delivery is free
  const isDeliveryFree = (charges) => {
    return parseFloat(charges) <= 0.01; // Consider charges less than or equal to 0.01 as free
  };

  // Use the appropriate language title and category
  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/v1$/, '');
  const title = i18n.language === 'ar' ? product?.ar_title : product?.en_title;
  const category = i18n.language === 'ar' ? product?.ar_category : product?.en_category;
  return (
    <div className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
      <Card
        hoverable
        className="h-full"
        onClick={handleCardClick}
        cover={
          <div className="relative overflow-hidden h-48 sm:h-64">
            <img
              alt={title || 'Product Image'}
              src={`${product?.main_image_url}`}
              className="w-full h-full object-contain" // Ensure the image fits within the card
            />
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {parseFloat(product?.discount) > 0 && (
                <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <FaTag className="mr-1" /> {parseInt(product?.discount)}% {t('product.off')}
                </div>
              )}
              {isDeliveryFree(product?.delivery_charges) && (
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <FaTruck className="mr-1" /> {t('product.freeDelivery')}
                </div>
              )}
            </div>
          </div>
        }
        bodyStyle={{ padding: '12px' }}
      >
        <Meta
          title={
            <div>
              <Text className="text-xs sm:text-sm text-gray-500">{category}</Text>
              <Text strong className="text-sm sm:text-lg block truncate">{title}</Text>
            </div>
          }
          description={
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between items-center mt-2">
                <Text className="text-sm sm:text-lg font-semibold">
                  {product?.price || product?.final_price} PKR
                </Text>
                <Text type="secondary" className="text-xs sm:text-sm">
                  {product.vat_included ? t('product.vatIncluded') : t('product.vatNotIncluded')}
                </Text>
              </div>
            </Space>
          }
        />
      </Card>
    </div>
  );
};

const ProductList = () => {
  const { t } = useTranslation();
  const { currentView, recommendedProducts, searchResults, isSearching, isLoadingRecommended } = useWebRelated();

  const productsToDisplay = currentView === 'searchResults' ? searchResults : recommendedProducts;
  console.log(productsToDisplay,"productsToDisplay")
  if (isSearching || (currentView === 'home' && isLoadingRecommended)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-6 sm:py-10">
      <div className="container mx-auto px-2 sm:px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
          {currentView === 'searchResults'
            ? t('productList.searchResults')
            : t('productList.recommendedProducts')}
        </h2>
        {productsToDisplay.length > 0 ? (
          <div className="flex flex-wrap -mx-2">
            {productsToDisplay.map((product) => (
              <ProductCard key={product?._id} product={product} />
            ))}
          </div>
        ) : (
          <Empty
            description={
              <span className="text-gray-500">
                {currentView === 'searchResults'
                  ? t('productList.noSearchResults')
                  : t('productList.noProductsAvailable')}
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}; 

export default ProductList;