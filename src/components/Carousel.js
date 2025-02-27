import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const watches = [
  {
    id: 1,
    src: "/c1.avif",
    alt: "Apple Watch with black fabric band and colorful watch face"
  },
  {
    id: 2,
    src: "/c2.avif",
    alt: "Apple Watch with black rubber band showing app grid"
  },
  {
    id: 3,
    src: "/c3.avif",
    alt: "Apple Watch with black fabric band and colorful watch face"
  },
];

export default function Carousel() {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const isRTL = i18n.dir() === 'rtl';
  const autoScrollTimerRef = useRef(null);

  const updateSlide = (direction) => {
    setCurrentSlide((prev) => 
      direction === 'next' 
        ? (prev + 1) % watches.length 
        : (prev - 1 + watches.length) % watches.length
    );
  };

  const resetAutoScroll = useCallback(() => {
    clearInterval(autoScrollTimerRef.current);
    if (isAutoScrolling) {
      autoScrollTimerRef.current = setInterval(() => updateSlide('next'), 3000);
    }
  }, [isAutoScrolling]);

  useEffect(() => {
    resetAutoScroll();
    return () => clearInterval(autoScrollTimerRef.current);
  }, [resetAutoScroll]);

  const toggleAutoScroll = (isHovering) => {
    setIsAutoScrolling(!isHovering);
    resetAutoScroll();
  };

  return (
    <div
      className="relative w-full h-[20vh] sm:h-[50vh] overflow-hidden bg-black"
      onMouseEnter={() => toggleAutoScroll(true)}
      onMouseLeave={() => toggleAutoScroll(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{
          transform: `translateX(${isRTL ? currentSlide * 100 : -currentSlide * 100}%)`,
        }}
      >
        {watches.map((watch) => (
          <div key={watch._id} className="w-full h-full flex-shrink-0">
            <img src={watch.src} alt={watch.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-all duration-300"
        onClick={() => { updateSlide('prev'); toggleAutoScroll(true); }}
        aria-label={t('carousel.previousSlide')}
      >
        <FaChevronLeft className="h-6 w-6" />
      </button>

      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-all duration-300"
        onClick={() => { updateSlide('next'); toggleAutoScroll(true); }}
        aria-label={t('carousel.nextSlide')}
      >
        <FaChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {watches.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => { setCurrentSlide(index); toggleAutoScroll(true); }}
            aria-label={t('carousel.goToSlide', { number: index + 1 })}
          />
        ))}
      </div>
    </div>
  );
}
