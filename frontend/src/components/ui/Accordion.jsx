import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 py-4">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold text-base text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </div>
      {isOpen && (
        <div className="space-y-3 mt-2 animate-in slide-in-from-top-1 duration-200">{children}</div>
      )}
    </div>
  );
};

export default Accordion;
