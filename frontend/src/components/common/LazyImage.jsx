import React from "react";

const LazyImage = ({ 
  src, 
  alt, 
  className, 
  breakpoints = {}, 
  priority = false 
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  const srcSet = breakpoints.s300 
    ? `${breakpoints.s300} 300w, ${breakpoints.s600} 600w, ${src} 1200w` 
    : undefined;

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 300px, (max-width: 1024px) 600px, 1200px"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        decoding="async" 
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default LazyImage;