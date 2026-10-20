import { useState, useRef } from 'react';
import { Eye, Heart, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ProductGallery = ({ images, main, inStock = true }) => {
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const gallery = [main, ...images];

  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setMainImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setMainImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="order-2 lg:order-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto scrollbar-hide w-full lg:w-20 lg:max-h-[500px] shrink-0 justify-center lg:justify-start">
          {[main, ...images].map((img, idx) => (
            <button
              key={idx}
              onClick={() => setMainImageIdx(idx)}
              className={`relative flex-shrink-0 w-16 lg:w-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                mainImageIdx === idx
                  ? 'border-[#163300] ring-1 ring-[#163300]'
                  : 'border-transparent '
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="order-1 lg:order-2 flex-1 w-full relative group">
          <div
            className="relative aspect-[4/4] bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in w-full lg:w-4/5 lg:mx-auto shadow-sm"
            onClick={() => setIsLightboxOpen(true)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {inStock && (
              <span className="absolute top-4 left-4 z-10 bg-[#f2c86c] text-[#163300] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                In Stock
              </span>
            )}
            <button className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm">
              <Heart size={20} />
            </button>

            <img
              src={gallery[mainImageIdx]}
              className="w-full h-full object-fill transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 pointer-events-none flex items-center gap-1">
              <Eye size={14} /> Click to expand
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={gallery[mainImageIdx]} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex items-center gap-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={prevImage}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform hover:scale-110"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-3 bg-white/10 hover:bg-red-500/20 hover:text-red-500 rounded-full text-white transition-transform hover:scale-110"
            >
              <X size={32} />
            </button>
            <button
              onClick={nextImage}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform hover:scale-110"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductGallery;
