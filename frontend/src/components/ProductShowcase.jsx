import ProductCard from './ui/ProductCard';
import {useTranslation} from '@/hooks/useTranslation.js'
import SkeletonCard from './ui/SkeletonCard.jsx';


const ProductShowcase = ({title="trendingNow",data,isloading=false}) => {

    const { t } = useTranslation();
  return (
     <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-4xl font-bold mb-4 reveal text-primary"
            >
              {t(title)}
            </h2>
            <div
              className="w-20 h-1 mx-auto rounded bg-accent"
            ></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
         {
         isloading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />):
          data.map((product)=>{
            return <ProductCard product={product} />
          })
         }
          </div>
        </div>
  )
}

export default ProductShowcase