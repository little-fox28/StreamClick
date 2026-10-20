import { useState, useEffect } from 'react';

export function useAutoSlider(totalSlides, interval = 5000) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, interval);

    return () => clearInterval(timer);
  }, [totalSlides, interval]);

  return [currentSlide, setCurrentSlide];
}
