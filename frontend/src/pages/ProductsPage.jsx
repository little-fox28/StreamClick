import { useState, lazy, Suspense } from 'react';
import { Search, X } from 'lucide-react';
import { useProductFilter } from '../hooks/useProductFilter';
import ProductCard from '../components/product/ProductCard';
import ProductGrid from '../components/product/ProductGrid';
import FilterToolbar from '../components/filters/FilterToolbar';
import MobileFilterBar from '../components/filters/MobileFilterBar';
import Skeleton from '../components/ui/Skeleton';

const MobileFilterDrawer = lazy(() => import('../components/filters/MobileFilterDrawer'));

const FILTER_OPTIONS = {
  competitions: [
    'World Cup 2026',
    'AFF Cup',
    'Premier League',
    'La Liga',
    'Serie A',
    'Bundesliga',
    'Champions League',
    'Saudi Pro League',
    'MLS',
  ],
  teams: [
    'Argentina',
    'Vietnam',
    'France',
    'Brazil',
    'Man City',
    'Arsenal',
    'Real Madrid',
    'Barcelona',
    'Inter Miami',
    'Al Nassr',
  ],
  versions: ['Authentic (Player)', 'Replica (Fan)', 'Retro'],
  sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  priceRanges: [
    { id: 'p1', label: 'Under R1000', min: 0, max: 1000 },
    { id: 'p2', label: 'R1000 - R2000', min: 1000, max: 2000 },
    { id: 'p3', label: 'Above R2000', min: 2000, max: 99999 },
  ],
};

const MOCK_PRODUCTS = Array.from({ length: 24 }).map((_, i) => {
  const isNational = i % 4 === 0;
  const isSpecialEvent = i % 5 === 0;

  let name, competition, team, imageFront, imageBack;

  if (isNational) {
    if (i % 2 === 0) {
      name = 'Argentina Home 2024';
      competition = 'World Cup 2026';
      team = 'Argentina';
      imageFront =
        'https://images.unsplash.com/photo-1511252998634-1181285db21d?auto=format&fit=crop&q=80&w=600';
      imageBack =
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600';
    } else {
      name = 'Vietnam Home 2024';
      competition = 'AFF Cup';
      team = 'Vietnam';
      imageFront =
        'https://images.unsplash.com/photo-1627632612658-0ce690a77693?auto=format&fit=crop&q=80&w=600';
      imageBack =
        'https://images.unsplash.com/photo-1627632612658-0ce690a77693?auto=format&fit=crop&q=80&w=600';
    }
  } else {
    if (i % 3 === 0) {
      name = 'Man City Home 24/25';
      competition = 'Premier League';
      team = 'Man City';
      imageFront =
        'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=600';
      imageBack =
        'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=600';
    } else {
      name = 'Real Madrid Home 24/25';
      competition = 'La Liga';
      team = 'Real Madrid';
      imageFront =
        'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&q=80&w=600';
      imageBack =
        'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&q=80&w=600';
    }
  }

  return {
    id: i + 1,
    name: name,
    slug: name.toLowerCase().replace(/ /g, '-'),
    price: 1899 + ((i * 50) % 1500),
    rating: 4.8,
    imageFront,
    imageBack,
    tag: i === 0 ? 'Best Seller' : i === 5 ? 'New' : null,
    attributes: {
      competition: competition,
      team: team,
      version: i % 2 === 0 ? 'Authentic (Player)' : 'Replica (Fan)',
      size: ['S', 'M', 'L', 'XL'],
    },
  };
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProductsPage() {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { filteredProducts, filters, setFilters, clearAllFilters, totalFilters } =
    useProductFilter(MOCK_PRODUCTS);

  return (
    <div className="min-h-screen font-sans bg-white text-gray-900">
      <FilterToolbar
        filters={filters}
        setFilters={setFilters}
        totalFilters={totalFilters}
        clearAllFilters={clearAllFilters}
        filterOptions={FILTER_OPTIONS}
      />

      <MobileFilterBar
        onFilterClick={() => setIsFilterDrawerOpen(true)}
        sortBy={filters.sortBy}
        onSortChange={setFilters.setSortBy}
        totalFilters={totalFilters}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-2">
          <div className="text-sm text-gray-500">
            Showing <strong className="text-[#163300]">{filteredProducts.length}</strong> results
            {filters.selectedCompetitions.length > 0 && (
              <span>
                {' '}
                in{' '}
                <span className="text-[#163300] font-bold">
                  {filters.selectedCompetitions.join(', ')}
                </span>
              </span>
            )}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <ProductGrid>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        ) : (
          <div className="py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="inline-flex p-4 bg-white rounded-full mb-4 shadow-sm">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria.</p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-[#163300] text-white font-bold rounded-lg text-sm hover:bg-[#65cf21] hover:text-[#163300] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-xs text-gray-400 mb-4">
              You've viewed {filteredProducts.length} of {MOCK_PRODUCTS.length} products
            </p>
            <div className="w-48 h-1 bg-gray-100 rounded-full mx-auto mb-6 overflow-hidden">
              <div
                className="h-full bg-[#163300]"
                style={{
                  width: `${(filteredProducts.length / MOCK_PRODUCTS.length) * 100}%`,
                }}
              ></div>
            </div>
            <button className="px-10 py-3 bg-white border-2 border-[#163300] text-[#163300] font-bold rounded-full hover:bg-[#163300] hover:text-white transition-all shadow-sm active:scale-95">
              Load More
            </button>
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        <MobileFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          setFilters={setFilters}
          clearAllFilters={clearAllFilters}
          filterOptions={FILTER_OPTIONS}
          resultCount={filteredProducts.length}
        />
      </Suspense>
    </div>
  );
}
