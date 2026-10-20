import { Check } from 'lucide-react';

const Checkbox = ({ checked, onChange, label, className = '' }) => {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer min-h-11 ${className}`}
      style={{ minWidth: '44px' }}
    >
      <div
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
          checked ? 'bg-[#163300] border-[#163300]' : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <span className={`text-sm ${checked ? 'text-[#163300] font-bold' : 'text-gray-600'}`}>
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
