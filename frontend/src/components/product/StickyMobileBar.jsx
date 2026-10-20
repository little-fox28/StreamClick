
import { formatCurrency } from '@/lib/currency.js'; 
import { useTranslation } from "@/hooks/useTranslation.js";

const StickyMobileBar = ({ totalPrice, onAddToCart, isVisible }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 lg:hidden flex gap-4 items-center ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex-1 flex flex-col justify-center">
   
        <span className="text-xs text-gray-500 font-medium uppercase">
          {t("totalEst")}
        </span>
        <span className="text-xl font-extrabold text-[#163300]">
          {formatCurrency(totalPrice)}
        </span>
      </div>
      
      <button
        onClick={onAddToCart}
        className="flex-[2] bg-[#65cf21] text-[#163300] font-bold text-base py-3 px-6 rounded-lg shadow-sm hover:bg-[#52a81b] transition-colors active:scale-95 whitespace-nowrap"
      >
      
        {t("addToCart")}
      </button>
    </div>
  );
};

export default StickyMobileBar;