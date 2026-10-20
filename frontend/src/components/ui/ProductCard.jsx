
import { Heart, Star, Eye } from "lucide-react";
import LazyImage from "../common/LazyImage";
import { formatCurrency } from "@/lib/currency.js";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation.js";
import { Link } from "react-router-dom";
const ProductCard = ({ product }) => {
  const { currentLang } = useLanguage();
  const activeLocale = currentLang === "EN" ? "en-ZA" : "af-ZA";
  const { t } = useTranslation();
  if (!product) return null;
  return (
    <Link
      to={`/product-detail/${product.slug}`}
      className="group block w-full h-auto transition-all duration-300 ease-in-out active:scale-95"
    >
      <div
        key={product.id}
        className="group relative flex flex-col cursor-pointer active:scale-90 active:opacity-90 transition-all duration-300  ease-in-out"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-transparent hover:border-secondary">
          {product.on_sale && (
            <span className="absolute top-2 left-2 z-10 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide bg-primary">
              On Sale
            </span>
          )}
          <button
            className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors active:scale-90"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart size={18} />
          </button>
          <LazyImage
            src={product.image}
            breakpoints={product.breakpoints}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block bg-gradient-to-t from-black/60 to-transparent">
            <button className="w-full text-white font-bold py-3 rounded shadow-lg transition-colors flex justify-center items-center gap-2 active:scale-95 bg-primary hover:bg-secondary hover:text-primary">
              <Eye size={18} /> {t("viewDetails")}
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">
            {product.category}
          </p>
          <h3 className="text-sm md:text-lg font-bold transition-colors line-clamp-1 group-hover:text-primary text-textMain">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm md:text-lg font-semibold text-primary">
              {formatCurrency(product.price, "ZAR", activeLocale)}
            </span>
            <div className="flex items-center text-yellow-500 text-xs">
              <Star size={12} fill="currentColor" />
              <span className="ml-1 text-gray-400">5.0</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
