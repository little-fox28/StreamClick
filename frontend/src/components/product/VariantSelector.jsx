
import { Ruler } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation.js';

const VariantSelector = ({ sizes, selectedSize, onSelectSize, error, onOpenSizeGuide }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
 
        <span className="font-bold text-gray-900">{t("selectSize")}</span>
        
    
        <button
          type="button"
          onClick={onOpenSizeGuide}
          className="text-xs font-bold text-[#163300] flex items-center gap-1 hover:text-[#65cf21] transition-colors"
        >
          <Ruler size={14} />
          <span className="underline underline-offset-2">{t("sizeGuide")}</span>
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {sizes.map((item, index) => {
          const sizeName = typeof item === 'object' ? item.name : item;
          const isOutOfStock = typeof item === 'object' ? item.stock === 0 : false;
          const isSelected = selectedSize === sizeName;

          return (
            <button
              key={index}
              disabled={isOutOfStock}
              onClick={() => onSelectSize(sizeName)}
              className={`relative w-12 h-12 rounded-lg flex items-center justify-center font-bold transition-all border-2
                ${isOutOfStock 
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50" 
                  : isSelected
                    ? "border-[#163300] bg-[#163300] text-white"
                    : "border-gray-200 text-gray-900 hover:border-[#163300] bg-white"
                }`}
              title={isOutOfStock ? t("outOfStock") : ""}
            >
              {sizeName}
            
              {isOutOfStock && (
                <div className="absolute w-full h-[2px] bg-gray-300 rotate-45" />
              )}
            </button>
          );
        })}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-2 animate-pulse font-medium">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

export default VariantSelector;