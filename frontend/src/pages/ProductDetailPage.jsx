import React, { useState, useRef, Suspense, lazy } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// --- COMPONENT IMPORTS ---
import ProductGallery from '../components/product/ProductGallery';
import ProductInfo from '../components/product/ProductInfo';
import VariantSelector from '../components/product/VariantSelector';
import PersonalizationBuilder from '../components/product/PersonalizationBuilder';
import ProductActions from '../components/product/ProductActions';
import StickyMobileBar from '../components/product/StickyMobileBar';
import RelatedProductsCarousel from '../components/product/RelatedProductsCarousel';
import { useProducts } from '@/context/ProductContext';
import { useTranslation } from '../hooks/useTranslation';

export default function ProductDetailPage() {
  const SizeGuideModal = lazy(() => import('../components/product/SizeGuideModal'));
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { products, fetchProductBySlug, fetchRelatedProducts } = useProducts();

  const {
    data: getDetailProduct,
    isLoading: isProductLoading,
    isError,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    staleTime: 1000 * 60 * 5,
  });
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', getDetailProduct?.id],
    queryFn: async () => {
      const relatedData = await fetchRelatedProducts(getDetailProduct.id);
      if (relatedData && relatedData.length > 0) {
        return relatedData;
      }
      return [...products]
        .filter((p) => p.id !== getDetailProduct.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
    },
    enabled: !!getDetailProduct?.id && products.length > 0,
  });

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [selectedPatch, setSelectedPatch] = useState(null);

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeError, setSizeError] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // --- 4. REFS & OBSERVERS ---
  const productActionsRef = useRef(null);
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-100px 0px 0px 0px' },
    );
    if (productActionsRef.current) observer.observe(productActionsRef.current);
    return () => observer.disconnect();
  }, [isProductLoading]);

  const basePrice = getDetailProduct?.on_sale
    ? Number(getDetailProduct?.sale_price)
    : Number(getDetailProduct?.regular_price || 0);

  const printPrice = Number(getDetailProduct?.print_price || 0);
  const currentPrintFee = customName.trim() !== '' || customNumber.trim() !== '' ? printPrice : 0;
  const currentPatchFee = Number(selectedPatch?.price || 0);
  const singleProductPrice = basePrice + currentPrintFee + currentPatchFee;
  const totalCalculatedPrice = singleProductPrice * quantity;

  // --- 6. HANDLERS ---
  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(t('pleaseSelectSize') || 'Please select a size');
      toast.error(t('pleaseSelectSize') || 'Please select a size');
      return;
    }

    setIsAddingToCart(true);

    setTimeout(() => {
      try {
        const newItem = {
          id: getDetailProduct?.id,
          name: getDetailProduct?.name,
          size: selectedSize,
          quantity: Number(quantity),
          price: Number(singleProductPrice.toFixed(2)),
          image: getDetailProduct?.image,
          customName: customName.trim().toUpperCase(),
          customNumber: customNumber.trim(),
          patchName: selectedPatch?.label || selectedPatch?.name || 'None',
        };

        let existingCart = JSON.parse(localStorage.getItem('my_cart')) || [];
        const existingIndex = existingCart.findIndex(
          (item) =>
            item.id === newItem.id &&
            item.size === newItem.size &&
            item.customName === newItem.customName &&
            item.customNumber === newItem.customNumber &&
            item.patchName === newItem.patchName,
        );

        if (existingIndex > -1) {
          existingCart[existingIndex].quantity += newItem.quantity;
        } else {
          existingCart.push({ ...newItem, tempId: Date.now() });
        }

        localStorage.setItem('my_cart', JSON.stringify(existingCart));

        toast.success(t('addedToCart') || 'Added to Bag', {
          description: (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded border border-gray-100 overflow-hidden shrink-0">
                  <img
                    src={getDetailProduct?.image}
                    alt="thumb"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-900 line-clamp-1">
                    {newItem.name}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Size {newItem.size} • {newItem.quantity} {t('quantity') || 'Qty'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 bg-[#163300] text-white text-[10px] font-black py-2 rounded uppercase tracking-tighter hover:bg-black transition-colors"
                >
                  {t('viewCart') || 'View Cart'}
                </button>
                <button
                  onClick={() => toast.dismiss()}
                  className="flex-1 bg-white border border-gray-200 text-gray-900 text-[10px] font-bold py-2 rounded uppercase tracking-tighter hover:bg-gray-50 transition-colors"
                >
                  {t('continue') || 'Continue'}
                </button>
              </div>
            </div>
          ),
          duration: 5000,
          icon: null,
          style: {
            padding: '12px',
            borderRadius: '16px',
            width: '320px',
          },
        });

        // RESET FORM
        setSelectedSize('');
        setQuantity(1);
        setCustomName('');
        setCustomNumber('');
        setSelectedPatch(null);
        setSizeError('');

        window.dispatchEvent(new Event('storage'));
      } catch (error) {
        toast.error('Error saving to cart!', error);
      } finally {
        setIsAddingToCart(false);
      }
    }, 500);
  };

  if (isProductLoading)
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (isError)
    return <div className="h-screen flex items-center justify-center">Error loading product.</div>;

  return (
    <div className="min-h-screen font-sans bg-white text-gray-900 pb-24 md:pb-0">
      <div className="container mx-auto px-4 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs text-gray-500 hover:text-[#163300]"
        >
          <ArrowLeft size={14} className="mr-1" /> {t('backToList')}
        </button>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 space-y-8">
            <ProductGallery
              images={getDetailProduct?.gallery || []}
              main={getDetailProduct?.image || ''}
              inStock={getDetailProduct?.total_stock !== 0}
            />
            <div className="border-t border-gray-200 pt-8 mt-10">
              <h3 className="font-bold text-lg text-gray-900 mb-6 uppercase">{t('infoTitle')}</h3>
              <div
                className="product-content-fix text-sm text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: getDetailProduct?.description
                    ?.replace(/style="[^"]*"/g, '')
                    ?.replace(/✅/g, '<br/>✅'),
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <ProductInfo
                title={getDetailProduct?.name}
                price={singleProductPrice}
                oldPrice={getDetailProduct?.on_sale ? getDetailProduct?.regular_price : null}
                rating={getDetailProduct?.rating}
                reviews={142}
              />
              <VariantSelector
                sizes={
                  getDetailProduct?.variations?.map((v) => Object.values(v.attributes)[0]) || []
                }
                selectedSize={selectedSize}
                onSelectSize={(size) => {
                  setSelectedSize(size);
                  setSizeError('');
                }}
                error={sizeError}
                onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
              />
              {getDetailProduct?.allow_print && (
                <PersonalizationBuilder
                  customName={customName}
                  setCustomName={setCustomName}
                  customNumber={customNumber}
                  setCustomNumber={setCustomNumber}
                  printPrice={getDetailProduct.print_price}
                  patches={getDetailProduct.patches}
                  selectedPatch={selectedPatch}
                  setSelectedPatch={setSelectedPatch}
                />
              )}
              <div ref={productActionsRef}>
                <ProductActions
                  quantity={quantity}
                  setQuantity={setQuantity}
                  onAddToCart={handleAddToCart}
                  onBuyNow={() => navigate('/cart')}
                  isAddingToCart={isAddingToCart}
                />
              </div>
            </div>
          </div>
        </div>
        <RelatedProductsCarousel products={relatedProducts || []} />
      </main>

      <StickyMobileBar
        totalPrice={totalCalculatedPrice}
        onAddToCart={handleAddToCart}
        isVisible={showStickyBar}
      />

      <Suspense fallback={null}>
        {isSizeGuideOpen && (
          <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
        )}
      </Suspense>
    </div>
  );
}
