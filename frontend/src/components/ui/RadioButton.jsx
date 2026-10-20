const RadioButton = ({ checked, onChange, label, name, className = '' }) => {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer min-h-11 ${className}`}
      style={{ minWidth: '44px' }}
    >
      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
          checked ? 'border-[#163300] border-[6px]' : 'border-gray-300 border-2 bg-white'
        }`}
      />
      <input type="radio" name={name} className="hidden" checked={checked} onChange={onChange} />
      <span className={`text-sm ${checked ? 'text-[#163300] font-bold' : 'text-gray-600'}`}>
        {label}
      </span>
    </label>
  );
};

export default RadioButton;
