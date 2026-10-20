
import { Star, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/currency.js';
import { useTranslation } from '@/hooks/useTranslation.js';

const ProductInfo = ({ title, price, oldPrice, rating, reviews }) => {
  const { t } = useTranslation();


  const installmentPrice = price / 4;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#163300] font-bold text-xs uppercase tracking-widest">Adidas</span>
        <div className="flex items-center gap-1 text-yellow-500 text-sm">
          <Star fill="currentColor" size={14} />
          <span className="text-gray-900 font-bold">{rating || 5}</span>
          <span className="text-gray-400 underline cursor-pointer ml-1">
            {reviews} {t("reviews")}
          </span>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2">
        {title}
      </h1>

      <div className="pb-4 border-b border-gray-100">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-[#163300]">
            {formatCurrency(price)}
          </span> 
          {oldPrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(oldPrice)}
              </span>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">
                {t("save")} {Math.round(((oldPrice - price) / oldPrice) * 100)}%
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">
          <CreditCard size={16} className="text-[#65cf21]" />
          <span className="text-gray-600">
            {t("payJustNowPrefix")}{' '}
            <span className="font-bold text-[#163300]">
              {formatCurrency(installmentPrice)}
            </span>{' '}
            {t("payJustNowSuffix")}
            <span className="font-extrabold italic ml-1 text-[#163300]">PayJustNow</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;