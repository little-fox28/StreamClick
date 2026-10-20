
import { X, Info, Ruler } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation.js';

const SizeGuideModal = ({ isOpen, onClose }) => {
      const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Ruler size={24} className="text-[#163300]" />
          <h3 className="text-xl font-bold text-[#163300]">{t("sizeGuideTitle")}</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          {t("sizeGuideSubtitle")} <br/>
          {t("sizeGuideFit")}
        </p>

        <div className="overflow-x-auto border rounded-lg border-gray-100">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-[#163300] text-white">
                <th className="p-3 font-semibold">{t("size")}</th>
                <th className="p-3 font-semibold">{t("chest")}</th>
                <th className="p-3 font-semibold">{t("waist")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">S</td>
                <td className="p-3">88 - 94</td>
                <td className="p-3">76 - 82</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">M</td>
                <td className="p-3">95 - 102</td>
                <td className="p-3">83 - 90</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">L</td>
                <td className="p-3">103 - 111</td>
                <td className="p-3">91 - 99</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">XL</td>
                <td className="p-3">112 - 121</td>
                <td className="p-3">100 - 109</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">2XL</td>
                <td className="p-3">122 - 132</td>
                <td className="p-3">110 - 121</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg flex gap-2 items-start">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>
            <strong>{t("proTip")}:</strong> {t("sizeTip")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;