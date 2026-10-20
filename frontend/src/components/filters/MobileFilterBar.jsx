
import { Filter, ArrowDownWideNarrow } from 'lucide-react';


const MobileFilterBar = ({
  onFilterClick,
  sortBy,
  onSortChange,
  totalFilters,
}) => {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex gap-3 shadow-sm">
      <button
        onClick={onFilterClick}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-lg h-10 text-sm font-bold text-gray-800 active:bg-gray-100"
      >
        <Filter size={16} /> Filters
        {totalFilters > 0 && (
          <span className="bg-[#163300] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            {totalFilters}
          </span>
        )}
      </button>

      <div className="flex-1 relative">
        <select
          className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 appearance-none focus:outline-none focus:border-[#163300]"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option>Featured</option>
          <option>Price: Low-High</option>
          <option>Price: High-Low</option>
          <option>Newest</option>
        </select>
        <ArrowDownWideNarrow
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default MobileFilterBar;
