import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-[#163300]">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-24">{children}</div>

        {footer && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
