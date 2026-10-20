import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ title, options, selected, onChange, type = 'checkbox' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (type === 'checkbox') {
      const newSelected = selected.includes(val)
        ? selected.filter((item) => item !== val)
        : [...selected, val];
      onChange(newSelected);
    } else {
      onChange(selected === val ? null : val);
    }
  };

  const isSelected = (val) => (type === 'checkbox' ? selected.includes(val) : selected === val);
  const activeCount = type === 'checkbox' ? selected.length : selected ? 1 : 0;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
          isOpen || activeCount > 0
            ? 'border-[#163300] bg-gray-50 text-[#163300]'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        {title}
        {activeCount > 0 && (
          <span className="bg-[#163300] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
            {options.map((opt) => {
              const value = typeof opt === 'object' ? opt.id : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              const checked = isSelected(value);

              return (
                <label
                  key={value}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
                      checked ? 'bg-[#163300] border-[#163300]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => handleSelect(value)}
                  />
                  <span
                    className={`text-sm ${checked ? 'text-[#163300] font-bold' : 'text-gray-600'}`}
                  >
                    {label}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-between items-center">
            <button
              onClick={() => onChange(type === 'checkbox' ? [] : null)}
              className="text-xs text-gray-500 hover:text-red-500 underline decoration-gray-300 underline-offset-2"
            >
              Reset
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-white bg-[#163300] px-3 py-1.5 rounded-lg hover:bg-[#1f4a00]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
