import { useTranslation } from "../hooks/useTranslation";
import { useRevealAnimations } from "../hooks/useRevealAnimations";
import { useAutoSlider } from "../hooks/useAutoSlider";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import "../styles/animations.css";
import {
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  ArrowRight,
  ChevronRight,
  Heart,
  Eye,
  Star,
} from "lucide-react";
import LazyImage from "@/components/common/LazyImage.jsx";
import RollingFlags from "@/components/RollingFlags.jsx";
import Testimonials from "@/components/Testimonials.jsx";
import { getProducts, getNewArrivals } from "../data/products";
import {
  getHeroSlides,
  getFeaturedCategories,
  getFeaturedLeaguesList,
  getFeatures,
} from "../data/home";

export default function HomePage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguage();
  useRevealAnimations();

  const formatCurrency = (amount) => {
    const locale = currentLang === "AF" ? "af-ZA" : "en-ZA";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const PRODUCTS = getProducts(t);
  const NEW_PRODUCTS = getNewArrivals(t);
  const FEATURED_CATEGORIES = getFeaturedCategories(t);
  const FEATURED_LEAGUES_LIST = getFeaturedLeaguesList(t);
  const FEATURES = getFeatures(
    t,
    <Truck size={28} />,
    <ShieldCheck size={28} />,
    <RefreshCw size={28} />,
    <Headphones size={28} />
  );

  const HERO_SLIDES = getHeroSlides(t).map((slide) => {
    return {
      ...slide,
      title: (
        <>
          {slide.title.split(" ").slice(0, 2).join(" ")} <br />{" "}
          {slide.title.split(" ").slice(2).join(" ")}
        </>
      ),
    };
  });

  const [currentHeroSlide, setCurrentHeroSlide] = useAutoSlider(
    HERO_SLIDES.length,
    5000
  );

  return (
    <div className="bg-white text-textMain">
      {/* 2. HERO SECTION SLIDER */}
      <section className="relative w-full h-125 md:h-175 bg-gray-900 overflow-hidden flex items-center">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentHeroSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 z-0">
              <LazyImage
                src={slide.image}
                alt={t("hero.alt")}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-linear-to-r from-primary/95 via-primary/50 to-transparent"></div>
            </div>
            <div className="container mx-auto px-4 z-10 relative text-white h-full flex items-center">
              <div className="max-w-2xl">
                <span className="inline-block py-1 px-3 text-xs font-bold tracking-wider uppercase mb-4 rounded-sm bg-secondary text-primary">
                  {t("officialBadge")}
                </span>
                <h1 className="text-3xl md:text-6xl font-bold leading-tight mb-6 reveal active">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg reveal active">
                  {slide.desc}
                </p>
                <div className="flex flex-wrap gap-4 reveal active">
                  <Link
                    to="/products"
                    className="font-bold py-3 px-8 rounded flex items-center gap-2 hover:shadow-xl shadow-lg bg-secondary text-primary"
                  >
                    {t("shopNow")} <ArrowRight size={20} />
                  </Link>
                  <Link
                    to="/products?competition=Accessories"
                    className="bg-transparent border-2 border-white hover:bg-white text-white hover:text-primary font-bold py-3 px-8 rounded transition-all"
                  >
                    {t("accessories")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Slider Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHeroSlide(idx)}
              className={`relative rounded-full transition-all duration-300 p-5 ${
                idx === currentHeroSlide
                  ? "bg-transparent"
                  : "bg-transparent hover:bg-white/10"
              }`}
              aria-label={t("hero.goToSlide").replace("{num}", idx + 1)}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  idx === currentHeroSlide
                    ? "bg-secondary w-8"
                    : "bg-white/50 w-2"
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      {/* 3. CATEGORY SECTION */}
      <section className="py-16 bg-lightBg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 reveal text-primary">
              {t("productCategories")}
            </h2>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 font-bold hover:underline text-primary"
            >
              {t("viewAll")} <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 md:gap-4 h-auto md:h-150">
            {/* 1. Large Card */}
            <Link
              to="/products?competition=Club Kits"
              className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md col-span-1 md:col-span-2 row-span-1 md:row-span-2 h-40 md:h-auto"
            >
              <LazyImage
                src={FEATURED_CATEGORIES[0].image}
                alt={FEATURED_CATEGORIES[0].name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 md:p-8">
                <h3 className="text-white text-lg md:text-3xl font-bold">
                  {FEATURED_CATEGORIES[0].name}
                </h3>
                <p className="text-gray-200 text-xs md:text-base hidden md:block">
                  {FEATURED_CATEGORIES[0].description}
                </p>
              </div>
            </Link>
            {/* 2. Medium Card */}
            <Link
              to="/products?competition=National Teams"
              className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md col-span-1 md:col-span-2 row-span-1 h-40 md:h-auto"
            >
              <LazyImage
                src={FEATURED_CATEGORIES[1].image}
                alt={FEATURED_CATEGORIES[1].name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-4 md:p-8">
                <h3 className="text-white text-lg md:text-2xl font-bold">
                  {FEATURED_CATEGORIES[1].name}
                </h3>
                <span className="text-secondary text-xs md:text-sm font-bold flex items-center gap-1">
                  {t("discover")} <ChevronRight size={14} />
                </span>
              </div>
            </Link>
            {/* 3. Small Card */}
            <Link
              to="/products?competition=Accessories"
              className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md col-span-1 md:col-span-1 row-span-1 h-32 md:h-auto"
            >
              <LazyImage
                src={FEATURED_CATEGORIES[2].image}
                alt={FEATURED_CATEGORIES[2].name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 text-center">
                <h3 className="text-white text-sm md:text-xl font-bold uppercase">
                  {FEATURED_CATEGORIES[2].name}
                </h3>
              </div>
            </Link>
            {/* 4. Small Card */}
            <Link
              to="/products?competition=Protective Gear"
              className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md col-span-1 md:col-span-1 row-span-1 h-32 md:h-auto"
            >
              <LazyImage
                src={FEATURED_CATEGORIES[3].image}
                alt={FEATURED_CATEGORIES[3].name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 text-center">
                <h3 className="text-white text-sm md:text-xl font-bold uppercase">
                  {FEATURED_CATEGORIES[3].name}
                </h3>
              </div>
            </Link>
          </div>

          <div className="mt-4 md:hidden text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-1 font-bold text-sm hover:underline text-primary"
            >
              {t("viewAll")} {t("categories")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW SECTION: SHOP BY LEAGUE */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 reveal text-primary">
              {t("topLeagues")}
            </h2>
            <div className="w-16 h-1 mx-auto rounded bg-accent"></div>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8 justify-items-center">
            {FEATURED_LEAGUES_LIST.map((league, idx) => (
              <Link
                key={idx}
                to={`/products?competition=${league.name}`}
                className="flex flex-col items-center gap-2 md:gap-4 group cursor-pointer"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center p-2 transition-all duration-300 transform group-hover:scale-110">
                  <LazyImage
                    src={league.logo}
                    alt={league.name}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
                <span className="font-bold text-xs md:text-base text-gray-800 group-hover:text-primary text-center">
                  {league.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS */}
      <section className="py-16 bg-lightBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 reveal text-primary">
              {t("trendingNow")}
            </h2>
            <div className="w-20 h-1 mx-auto rounded bg-accent"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col cursor-pointer"
              >
                <Link
                  to={`/product-detail/${product.slug}`}
                  className="relative aspect-3/4 overflow-hidden rounded-lg bg-gray-100 mb-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-transparent hover:border-secondary"
                >
                  {product.tag && (
                    <span className="absolute top-2 left-2 z-10 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide bg-primary">
                      {product.tag}
                    </span>
                  )}
                  <button
                    className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors active:scale-90"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart size={18} />
                  </button>
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Overlay - View Details */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block bg-linear-to-t from-black/60 to-transparent">
                    <div className="w-full text-white font-bold py-3 rounded shadow-lg transition-colors flex justify-center items-center gap-2 active:scale-95 bg-primary hover:bg-secondary hover:text-primary">
                      <Eye size={18} /> {t("viewDetails")}
                    </div>
                  </div>
                </Link>

                <div className="mt-auto">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    {product.category}
                  </p>
                  <Link to={`/product-detail/${product.slug}`}>
                    <h3 className="text-sm md:text-lg font-bold transition-colors line-clamp-1 group-hover:text-primary text-textMain">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm md:text-lg font-semibold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="flex items-center text-yellow-500 text-xs">
                      <Star size={12} fill="currentColor" />
                      <span className="ml-1 text-gray-400">
                        {t("ratingValue")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. NEW SECTION: NEW ARRIVALS */}
      <section className="py-16 bg-lightBg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-2 reveal text-primary">
                {t("newArrivals")}
              </h2>
              <div className="w-20 h-1 rounded bg-accent"></div>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-1 font-bold hover:underline transition-all text-primary"
            >
              {t("viewAll")} <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {NEW_PRODUCTS.map((product, idx) => (
              <div
                key={product.id}
                className="group relative flex flex-col cursor-pointer"
              >
                <Link
                  to={`/product-detail/${product.slug}`}
                  className="relative aspect-3/4 overflow-hidden rounded-lg bg-gray-100 mb-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-transparent hover:border-secondary"
                >
                  {product.tag && (
                    <span className="absolute top-2 left-2 z-10 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide bg-primary">
                      {product.tag}
                    </span>
                  )}
                  <button
                    className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors active:scale-90"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart size={18} />
                  </button>
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Overlay - View Details */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block bg-linear-to-t from-black/60 to-transparent">
                    <div className="w-full text-white font-bold py-3 rounded shadow-lg transition-colors flex justify-center items-center gap-2 active:scale-95 bg-primary hover:bg-secondary hover:text-primary">
                      <Eye size={18} /> {t("viewDetails")}
                    </div>
                  </div>
                </Link>

                <div className="mt-auto">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    {product.category}
                  </p>
                  <Link to={`/product-detail/${product.slug}`}>
                    <h3 className="text-sm md:text-lg font-bold transition-colors line-clamp-1 group-hover:text-primary text-textMain">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm md:text-lg font-semibold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="flex items-center text-yellow-500 text-xs">
                      <Star size={12} fill="currentColor" />
                      <span className="ml-1 text-gray-400">
                        {t("ratingValue")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile view all */}
          <div className="mt-8 md:hidden text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-bold hover:underline text-primary"
            >
              {t("viewAll")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. ROLLING FLAGS */}
      <RollingFlags />

      {/* 7. SECTION: TESTIMONIALS */}
      <Testimonials />

      {/* 6. SECTION: WHY CHOOSE US */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 reveal text-primary">
              {t("whyJerseyPlug")}
            </h2>
            <p className="text-textSub text-sm md:text-base max-w-2xl mx-auto">
              {t("qualityCommitment")}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-32 md:h-auto"
              >
                <div className="w-10 h-10 md:w-16 md:h-16 mb-3 md:mb-6 rounded-full flex items-center justify-center bg-accent/20">
                  <div className="text-primary">{feature.icon}</div>
                </div>
                <h3 className="text-sm md:text-lg font-bold mb-1 text-textMain">
                  {feature.title}
                </h3>
                <p className="text-textSub text-[10px] md:text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
