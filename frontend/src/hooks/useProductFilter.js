import { useState, useMemo } from 'react';

export const useProductFilter = (products) => {
  const [selectedCompetitions, setSelectedCompetitions] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [sortBy, setSortBy] = useState('Featured');

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      if (
        selectedCompetitions.length > 0 &&
        !selectedCompetitions.includes(product.attributes.competition)
      )
        return false;

      if (
        selectedTeams.length > 0 &&
        !selectedTeams.includes(product.attributes.team)
      )
        return false;

      if (
        selectedVersions.length > 0 &&
        !selectedVersions.includes(product.attributes.version)
      )
        return false;

      if (selectedSizes.length > 0) {
        const hasSize = product.attributes.size.some((s) =>
          selectedSizes.includes(s)
        );
        if (!hasSize) return false;
      }

      if (selectedPriceRange) {
        const FILTER_OPTIONS_PRICE_RANGES = [
          { id: 'p1', label: 'Under R1000', min: 0, max: 1000 },
          { id: 'p2', label: 'R1000 - R2000', min: 1000, max: 2000 },
          { id: 'p3', label: 'Above R2000', min: 2000, max: 99999 },
        ];
        const range = FILTER_OPTIONS_PRICE_RANGES.find(
          (r) => r.id === selectedPriceRange
        );
        if (range && (product.price < range.min || product.price > range.max))
          return false;
      }

      return true;
    });


    if (sortBy === 'Price: Low to High' || sortBy === 'Price: Low-High') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (
      sortBy === 'Price: High to Low' ||
      sortBy === 'Price: High-Low'
    ) {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [
    products,
    selectedCompetitions,
    selectedTeams,
    selectedVersions,
    selectedSizes,
    selectedPriceRange,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setSelectedCompetitions([]);
    setSelectedTeams([]);
    setSelectedVersions([]);
    setSelectedSizes([]);
    setSelectedPriceRange(null);
  };

  const totalFilters =
    selectedCompetitions.length +
    selectedTeams.length +
    selectedVersions.length +
    selectedSizes.length +
    (selectedPriceRange ? 1 : 0);

  return {
    filteredProducts,
    filters: {
      selectedCompetitions,
      selectedTeams,
      selectedVersions,
      selectedSizes,
      selectedPriceRange,
      sortBy,
    },
    setFilters: {
      setSelectedCompetitions,
      setSelectedTeams,
      setSelectedVersions,
      setSelectedSizes,
      setSelectedPriceRange,
      setSortBy,
    },
    clearAllFilters,
    totalFilters,
  };
};
