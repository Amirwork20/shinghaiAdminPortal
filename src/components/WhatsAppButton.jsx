import React from 'react';

const WhatsAppButton = () => {
  const phoneNumber = '971502381709'; // Replace with your actual WhatsApp number
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 z-50 rounded-full p-2 sm:p-3 bg-white shadow-lg hover:bg-green-200 transition-colors duration-300"
    >
      <img
        src="/icon-removebg-preview.png" // Make sure to add this image to your public folder
        alt="WhatsApp"
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
      />
    </a>
  );
};

export default WhatsAppButton;