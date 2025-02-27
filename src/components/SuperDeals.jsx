import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Progress, message, Spin } from 'antd';
import { FaFire, FaPercent, FaShoppingCart, FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWebRelated } from '../context/WebRelatedContext';

const { Text } = Typography;

const SuperDealCard = ({ deal }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/v1$/, '');
  if (!deal) return null;
  console.log(deal,"deal.total_price");
  const handleCardClick = () => {
    navigate('/place-order#', { state: { product: deal } });
  };

  // Function to check if delivery is free
  const isDeliveryFree = (charges) => {
    return parseFloat(charges) <= 0.01; // Consider charges less than or equal to 0.01 as free
  };

  // Use the appropriate language title
  const title = i18n.language === 'ar' ? deal.ar_title : deal.en_title;

  return (
    <div className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 p-2">
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl group cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative overflow-hidden">
          <img
            src={`${deal.main_image}`} 
            alt={title} 
            className="w-full h-36 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {deal.hot_deal && (
              <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                <FaFire className="mr-1" /> {t('superDeals.hotDeal')}
              </div>
            )}
            {isDeliveryFree(deal.delivery_charges) && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                <FaTruck className="mr-1" /> {t('product.freeDelivery')}
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <FaPercent className="mr-1" /> {parseInt(deal.discount)} {t('product.off')}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button className="bg-white text-gray-800 px-3 py-1 sm:px-4 sm:py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center text-xs sm:text-sm">
              <FaShoppingCart className="me-1 sm:me-2" /> {t('superDeals.viewDeal')}
            </button>
          </div>
        </div>
        <div className="p-2 sm:p-4 flex-grow flex flex-col justify-between">
          <div>
            <Text strong className="text-xs sm:text-sm block truncate group-hover:text-red-500 transition-colors duration-300">{title}</Text>
            <div className="flex justify-between items-center mt-1 sm:mt-2">
              <Text className="text-red-500 font-bold text-sm sm:text-lg">{parseFloat(deal.total_price)} PKR</Text>
              <Text delete type="secondary" className="text-xs">
                {parseFloat(deal.actual_price)} PKR
              </Text>
            </div>
          </div>
          <div className="mt-auto">
            <div className="mt-1 sm:mt-2">
              <Progress 
                percent={(deal.sold / deal.quantity) * 100} 
                size="small" 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={() => (
                  <span className="text-xs flex items-center">
                    <FaShoppingCart className="me-1" /> {deal.sold} {t('superDeals.sold')}
                  </span>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuperDeals = () => {
  const { t } = useTranslation();
  const { getSuperDeals } = useWebRelated();
  const [superDealsData, setSuperDealsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuperDeals = async () => {
      try {
        setLoading(true);
        const deals = await getSuperDeals();
        setSuperDealsData(deals || []); // Ensure it's always an array
        setError(null);
      } catch (error) {
        console.error('Error fetching super deals:', error);
        setError(t('errors.fetchSuperDeals'));
        message.error(t('errors.fetchSuperDeals'));
      } finally {
        setLoading(false);
      }
    };

    fetchSuperDeals();
  }, [getSuperDeals, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-4 sm:pb-11">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <FaFire className="text-red-500 text-2xl sm:text-3xl mr-2" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('superDeals.title')}</h2>
        </div>
        {superDealsData.length > 0 ? (
          <div className="flex flex-wrap -mx-2">
            {superDealsData.map((deal, index) => (
              <SuperDealCard key={index} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 p-4">
            {t('superDeals.noDealsAvailable')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperDeals;