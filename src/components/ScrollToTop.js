import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'instant'  // Changed from 'smooth' to 'instant'
      });
    };
    scrollToTop();
  }, [pathname]);

  return null;
}

export default ScrollToTop;
