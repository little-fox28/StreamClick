
import Drawer from '../ui/Drawer';
import Accordion from '../ui/Accordion';
import Checkbox from '../ui/Checkbox';
import RadioButton from '../ui/RadioButton';

const MobileFilterDrawer = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  clearAllFilters,
  filterOptions,
  resultCount,
}) => {
  const footer = (
    <div className="flex gap-3">
      <button
        onClick={clearAllFilters}
        className="flex-1 py-3.5 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
      >
        Reset
      </button>
      <button
        onClick={onClose}
        className="flex-2 py-3.5 text-sm font-bold text-white bg-[#163300] rounded-xl shadow-lg active:scale-95 transition-transform"
      >
        Show Results ({resultCount})
      </button>
    </div>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filters" footer={footer}>
      <div className="space-y-2">
        <Accordion title="Competitions">
          <div className="space-y-2">
            {filterOptions.competitions.map((c) => (
              <Checkbox
                key={c}
                label={c}
                checked={filters.selectedCompetitions.includes(c)}
                onChange={() => {
                  setFilters.setSelectedCompetitions((prev) =>
                    prev.includes(c)
                      ? prev.filter((i) => i !== c)
                      : [...prev, c]
                  );
                }}
              />
            ))}
          </div>
        </Accordion>

        <Accordion title="Teams">
          <div className="space-y-2">
            {filterOptions.teams.map((t) => (
              <Checkbox
                key={t}
                label={t}
                checked={filters.selectedTeams.includes(t)}
                onChange={() => {
                  setFilters.setSelectedTeams((prev) =>
                    prev.includes(t)
                      ? prev.filter((i) => i !== t)
                      : [...prev, t]
                  );
                }}
              />
            ))}
          </div>
        </Accordion>

        <Accordion title="Versions">
          <div className="space-y-2">
            {filterOptions.versions.map((v) => (
              <Checkbox
                key={v}
                label={v}
                checked={filters.selectedVersions.includes(v)}
                onChange={() => {
                  setFilters.setSelectedVersions((prev) =>
                    prev.includes(v)
                      ? prev.filter((i) => i !== v)
                      : [...prev, v]
                  );
                }}
              />
            ))}
          </div>
        </Accordion>

        <Accordion title="Size">
          <div className="grid grid-cols-4 gap-2">
            {filterOptions.sizes.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setFilters.setSelectedSizes((prev) =>
                    prev.includes(s)
                      ? prev.filter((i) => i !== s)
                      : [...prev, s]
                  )
                }
                className={`text-xs py-2.5 rounded-lg border font-bold transition-all ${
                  filters.selectedSizes.includes(s)
                    ? 'bg-[#163300] text-white border-[#163300]'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Accordion>

        <Accordion title="Price">
          <div className="space-y-2">
            {filterOptions.priceRanges.map((r) => (
              <RadioButton
                key={r.id}
                name="mobile_price"
                label={r.label}
                checked={filters.selectedPriceRange === r.id}
                onChange={() => setFilters.setSelectedPriceRange(r.id)}
              />
            ))}
          </div>
        </Accordion>
      </div>
    </Drawer>
  );
};

export default MobileFilterDrawer;
