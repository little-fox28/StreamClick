import { Shirt, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/currency.js';
import { useTranslation } from '@/hooks/useTranslation.js';

const PersonalizationBuilder = ({
  customName,
  setCustomName,
  customNumber,
  setCustomNumber,
  patches,
  selectedPatch,
  setSelectedPatch,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <Shirt size={18} className="text-[#163300]" />
        <h4 className="font-bold text-sm text-gray-900">
          {t('personalizeTitle')}{' '}
          <span className="text-xs font-normal text-gray-500">{t('optional')}</span>
        </h4>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('nameOnBack')}</label>
            <input
              type="text"
              placeholder={t('placeholderName')}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#163300] uppercase font-mono"
              maxLength={15}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('number')}</label>
            <input
              type="text"
              placeholder="10"
              value={customNumber}
              onChange={(e) => setCustomNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#163300] font-mono"
              maxLength={3}
            />
          </div>
        </div>

        {/* Shirt Preview Card */}
        <div className="w-32 h-36 shrink-0 relative bg-white border border-gray-200 rounded-lg p-1">
          {customName || customNumber ? (
            <div className="w-full h-full bg-[#163300] rounded flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200 overflow-hidden relative">
              <div className="absolute top-0 w-full h-4 bg-[#65cf21] opacity-20"></div>
              <svg viewBox="0 0 200 240" className="w-full h-full z-10">
                <text
                  x="100"
                  y="80"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={customName.length > 8 ? '20' : '28'}
                  fontWeight="bold"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {customName.toUpperCase()}
                </text>
                <text
                  x="100"
                  y="180"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="90"
                  fontWeight="bold"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {customNumber || '00'}
                </text>
              </svg>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-center p-2 bg-gray-50">
              <Sparkles size={20} className="text-[#65cf21] mb-1" />
              <span className="text-[9px] font-bold text-gray-400 uppercase">{t('preview')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Patches Section */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
          {t('addPatch')}
        </label>
        <div className="flex flex-wrap gap-2">
          {patches.map((patch, index) => (
            <button
              key={index}
              onClick={() => {
                if (selectedPatch?.label === patch.label) {
                  setSelectedPatch(null);
                } else {
                  setSelectedPatch(patch);
                }
              }}
              className={`px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                selectedPatch?.label === patch.label
                  ? 'bg-[#163300] text-white border-[#163300] shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#163300] hover:text-[#163300]'
              }`}
            >
              <span className="font-medium">{patch.label}</span>
              {patch.price > 0 && (
                <span className="ml-1 opacity-80">(+{formatCurrency(patch.price)})</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalizationBuilder;
