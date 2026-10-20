
import { Minus, Plus, ShoppingCart, Zap, Loader2 } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation.js";

const ProductActions = ({ 
  quantity, 
  setQuantity, 
  onAddToCart, 
  onBuyNow, 
  isAddingToCart 
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 mb-8">
      <div className="flex gap-4">
 
        <div className="flex items-center border-2 border-gray-200 rounded-xl w-32 h-14 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#163300]"
            disabled={quantity <= 1}
          >
            <Minus size={18} />
          </button>
          <span className="flex-1 text-center font-bold text-lg">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#163300]"
          >
            <Plus size={18} />
          </button>
        </div>
        <button
          onClick={onAddToCart}
          disabled={isAddingToCart}
          className="flex-1 h-14 bg-[#163300] hover:bg-[#52a81b] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <>
              <Loader2 size={20} className="animate-spin" /> {t("adding")}...
            </>
          ) : (
            <>
              <ShoppingCart size={20} /> {t("addToCart")}
            </>
          )}
        </button>
      </div>
      <button
        onClick={onBuyNow}
        className="w-full h-14 bg-[#f2c86c] text-[#163300] hover:bg-[#52a81b] hover:text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Zap size={20} fill="currentColor" /> {t("buyNow")}
      </button>
    </div>
  );
};

export default ProductActions;