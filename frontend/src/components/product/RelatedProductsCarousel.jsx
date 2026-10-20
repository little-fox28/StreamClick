
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency.js';
import { useTranslation } from '@/hooks/useTranslation.js';

const RelatedProductsCarousel = ({ products }) => {
    const { t } = useTranslation();

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="flex justify-between items-end mb-6 px-4 md:px-0">
        <h2 className="text-2xl font-bold text-[#163300]">
          {t("relatedTitle")} 
        </h2>

        <a href="/products" className="text-sm font-bold text-[#65cf21] flex items-center gap-1 hover:underline">
          {t("viewAll")} <ArrowRight size={14} /> 
        </a>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 px-4 md:px-0 scrollbar-hide">
        {products.map((prod) => (
          <a key={prod.id} className='w-full h-auto ' href={`/product-detail/${prod.slug}`}>
            <div className="snap-center shrink-0 w-[180px] md:w-[220px] group cursor-pointer">
              <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3 border border-transparent hover:border-[#f2c86c] transition-all">
                <img
                  src={prod.image}
                  alt={prod.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-1">
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{prod.name}</h3>
                <span className="text-sm font-bold text-[#163300] mt-1 block">
                  {formatCurrency(prod.price)}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default RelatedProductsCarousel;