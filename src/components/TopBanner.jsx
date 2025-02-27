import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTruck, FaPercent, FaCreditCard } from 'react-icons/fa';

const TopBanner = () => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const { t } = useTranslation();

  const messages = [
    { icon: FaTruck, text: t('banner.freeShipping') },
    { icon: FaPercent, text: t('banner.discount') },
    { icon: FaCreditCard, text: t('banner.payLater') },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-red-600 text-white py-2 px-4 font-sans">
      <div className="container mx-auto flex justify-center items-center text-sm">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 transition-opacity duration-500 ${
              index === visibleIndex ? 'opacity-100' : 'opacity-0'
            } ${index === visibleIndex ? '' : 'absolute'}`}
          >
            <message.icon className="h-4 w-4" />
            <span>{message.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopBanner;