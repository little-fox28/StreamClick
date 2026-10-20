import React, { useState, useEffect, useRef } from "react";
import { Heart, Star, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const ProductCard = React.memo(({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateSrcSet = (url) => {
    if (!url) return "";
    const base = url.split("?")[0];
    const params = "auto=format&fit=crop&q=80";
    return `${base}?${params}&w=300 300w, ${base}?${params}&w=600 600w, ${base}?${params}&w=800 800w`;
  };

  const currentImage = isHovered ? product.imageBack : product.imageFront;

  return (
    <div
      className="group cursor-pointer flex flex-col gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product-detail/${product.slug || product.id}`} className="relative aspect-4/5 bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        {product.tag && (
          <span className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur text-[#163300] text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
            {product.tag}
          </span>
        )}

        <button 
          className="absolute top-2 right-2 z-10 p-2 bg-white/60 hover:bg-white rounded-full text-black transition-colors"
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart size={16} />
        </button>

        {isVisible && (
          <img
            ref={imgRef}
            src={currentImage}
            srcSet={generateSrcSet(currentImage)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="absolute inset-x-3 bottom-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden lg:block">
          <button className="w-full bg-[#163300] text-white font-bold py-2.5 rounded-lg text-xs hover:bg-[#65cf21] hover:text-[#163300] transition-colors shadow-lg flex items-center justify-center gap-2">
            <Plus size={14} /> Quick Add
          </button>
        </div>
      </Link>

      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">
          {product.attributes.competition}
        </p>
        <Link to={`/product-detail/${product.slug || product.id}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-[#163300] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          <div className="flex items-center gap-0.5 text-yellow-500 text-[10px]">
            <Star size={10} fill="currentColor" /> <span>{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
