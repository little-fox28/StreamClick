import { Filter, X } from 'lucide-react';
import FilterDropdown from './FilterDropdown';

const FilterToolbar = ({ filters, setFilters, totalFilters, clearAllFilters, filterOptions }) => {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 hidden lg:block">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-3 text-gray-400 shrink-0">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>

          <FilterDropdown
            title="Competitions"
            options={filterOptions.competitions}
            selected={filters.selectedCompetitions}
            onChange={setFilters.setSelectedCompetitions}
          />

          <FilterDropdown
            title="Teams"
            options={filterOptions.teams}
            selected={filters.selectedTeams}
            onChange={setFilters.setSelectedTeams}
          />

          <FilterDropdown
            title="Version"
            options={filterOptions.versions}
            selected={filters.selectedVersions}
            onChange={setFilters.setSelectedVersions}
          />

          <FilterDropdown
            title="Size"
            options={filterOptions.sizes}
            selected={filters.selectedSizes}
            onChange={setFilters.setSelectedSizes}
          />

          <FilterDropdown
            title="Price"
            options={filterOptions.priceRanges}
            selected={filters.selectedPriceRange}
            onChange={setFilters.setSelectedPriceRange}
            type="radio"
          />

          {totalFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-sm text-red-500 font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <X size={14} /> Clear ({totalFilters})
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-6 shrink-0">
          <span className="text-sm text-gray-500">Sort:</span>
          <select
            className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-[#163300]"
            value={filters.sortBy}
            onChange={(e) => setFilters.setSortBy(e.target.value)}
          >
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
